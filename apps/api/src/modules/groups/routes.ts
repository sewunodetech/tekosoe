import { Router } from "express";
import { z } from "zod";
import { computeNoteHash, spendNoteSchema } from "@tekosue/shared";
import type { RouteContext } from "../../context";
import type { GroupMetaRow, SpendMetaRow, SpendReviewRow } from "../../db/repos";
import { checksumAddress, sameAddress } from "../../lib/address";
import { ApiError, errors } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { apiRateLimit, MINUTE_MS } from "../../middleware/rateLimit";
import { pathParam, validate } from "../../middleware/validate";

const decimalId = z.string().regex(/^\d+$/, "must be a decimal id");
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

const groupIdParams = z.object({ groupId: decimalId });
const spendParams = z.object({ groupId: decimalId, spendId: decimalId });

const groupMetaBodySchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1)
        .max(60)
        .refine((value) => !CONTROL_CHARS.test(value), "name contains control characters"),
    ),
});

const reviewBodySchema = z
  .object({
    seen: z.boolean().default(false),
    decisionNote: z.string().max(280).nullable().optional(),
  })
  .refine((body) => body.seen || body.decisionNote !== undefined, "nothing to update");

function serializeGroupMeta(row: GroupMetaRow) {
  return {
    groupId: String(row.groupId),
    name: row.name,
    createdBy: checksumAddress(row.createdBy),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeSpendMeta(row: SpendMetaRow) {
  return {
    groupId: String(row.groupId),
    spendId: String(row.spendId),
    noteHash: row.noteHash,
    title: row.title,
    category: row.category,
    note: row.note,
    receiptHash: row.receiptHash,
    createdBy: checksumAddress(row.createdBy),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeReview(row: SpendReviewRow) {
  return {
    spendId: String(row.spendId),
    member: checksumAddress(row.member),
    seenAt: row.seenAt ? row.seenAt.toISOString() : null,
    decisionNote: row.decisionNote,
  };
}

/**
 * /api/groups/:groupId/... — off-chain labels for on-chain groups and spends.
 * Every write is pinned to the contract: group meta only by the on-chain creator, spend meta only by
 * the spender and only if computeNoteHash matches.
 */
export function createGroupRoutes(ctx: RouteContext): Router {
  const router = Router();
  const auth = requireAuth(ctx.env);
  const member = ctx.membership.middleware();

  // Public: the invite screen shows the trip name before the visitor joins.
  router.get(
    "/:groupId/meta",
    // Public, cheap read: per minute, not per hour.
    apiRateLimit({
      windowMs: MINUTE_MS,
      max: 120,
      code: "RATE_LIMITED",
      message: "Too many requests, try again later",
    }),
    validate({ params: groupIdParams }),
    async (req, res) => {
      const row = await ctx.repos.groupMeta.get(Number(pathParam(req, "groupId")));
      if (!row) throw errors.notFound("GROUP_META_NOT_FOUND", "This trip has no details yet");
      res.json(serializeGroupMeta(row));
    },
  );

  router.put(
    "/:groupId/meta",
    auth,
    validate({ params: groupIdParams, body: groupMetaBodySchema }),
    async (req, res) => {
      const groupId = BigInt(pathParam(req, "groupId"));
      const body = req.body as z.infer<typeof groupMetaBodySchema>;
      const group = await ctx.chain.getGroup(groupId);

      if (!sameAddress(group.creator, req.auth!.address)) {
        throw errors.forbidden("NOT_GROUP_CREATOR", "Only the trip creator can set its details");
      }

      const row = {
        groupId: Number(groupId),
        name: body.name,
        createdBy: req.auth!.address,
      };
      const created = await ctx.repos.groupMeta.insert(row);
      const stored = (await ctx.repos.groupMeta.get(row.groupId))!;
      if (!created && stored.name !== row.name) {
        throw errors.conflict("GROUP_META_EXISTS", "This trip already has details");
      }
      res.status(created ? 201 : 200).json(serializeGroupMeta(stored));
    },
  );

  router.get("/:groupId/spends/meta", auth, member, async (req, res) => {
    const rows = await ctx.repos.spendMeta.listByGroup(Number(req.groupId));
    res.json({ spends: rows.map(serializeSpendMeta) });
  });

  router.put(
    "/:groupId/spends/:spendId/meta",
    auth,
    member,
    validate({ params: spendParams, body: spendNoteSchema }),
    async (req, res) => {
      const groupId = BigInt(pathParam(req, "groupId"));
      const spendId = BigInt(pathParam(req, "spendId"));
      const note = req.body as z.infer<typeof spendNoteSchema>;
      const spend = await ctx.chain.getSpend(groupId, spendId);

      if (!sameAddress(spend.spender, req.auth!.address)) {
        throw errors.forbidden("NOT_SPENDER", "Only the person who paid can label this payment");
      }
      const noteHash = computeNoteHash(note);
      if (noteHash.toLowerCase() !== spend.noteHash.toLowerCase()) {
        throw new ApiError(422, "NOTE_HASH_MISMATCH", "Details do not match the recorded payment", {
          expected: spend.noteHash,
          computed: noteHash,
        });
      }

      // Same hash ⇒ same content, so a repeated write is a harmless no-op.
      const created = await ctx.repos.spendMeta.insert({
        groupId: Number(groupId),
        spendId: Number(spendId),
        noteHash: noteHash.toLowerCase(),
        title: note.title,
        category: note.category,
        note: note.note,
        receiptHash: note.receiptHash?.toLowerCase() ?? null,
        createdBy: req.auth!.address,
      });
      const stored = (await ctx.repos.spendMeta.get(Number(groupId), Number(spendId)))!;
      res.status(created ? 201 : 200).json(serializeSpendMeta(stored));
    },
  );

  // P1 — "Seen" in Waiting and the reviewer's note in Declined.
  router.get("/:groupId/spends/reviews", auth, member, async (req, res) => {
    const rows = await ctx.repos.spendReviews.listByGroup(Number(req.groupId));
    res.json({ reviews: rows.map(serializeReview) });
  });

  router.put(
    "/:groupId/spends/:spendId/review",
    auth,
    member,
    validate({ params: spendParams, body: reviewBodySchema }),
    async (req, res) => {
      const body = req.body as z.infer<typeof reviewBodySchema>;
      const row = await ctx.repos.spendReviews.upsert({
        groupId: Number(pathParam(req, "groupId")),
        spendId: Number(pathParam(req, "spendId")),
        member: req.auth!.address,
        seen: body.seen,
        decisionNote: body.decisionNote,
      });
      res.json(serializeReview(row));
    },
  );

  return router;
}

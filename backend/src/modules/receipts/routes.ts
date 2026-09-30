import { Router } from "express";
import { z } from "zod";
import { ipKeyGenerator } from "express-rate-limit";
import type { RouteContext } from "../../context";
import { checksumAddress } from "../../lib/address";
import { errors } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { apiRateLimit, HOUR_MS } from "../../middleware/rateLimit";
import { pathParam, validate } from "../../middleware/validate";
import { confirmReceipt, createUploadUrl, findReceiptByNoteHash } from "./service";

const uploadBodySchema = z.object({
  groupId: z.string().regex(/^\d+$/, "must be a decimal group id"),
  sizeBytes: z.number().int().positive(),
});

const noteHashPattern = /^0x[0-9a-fA-F]{64}$/;

const confirmBodySchema = z.object({
  noteHash: z.string().regex(noteHashPattern, "must be a 32-byte hex hash"),
});

const noteHashParamsSchema = z.object({
  noteHash: z.string().regex(noteHashPattern, "must be a 32-byte hex hash"),
});

function serialize(row: {
  id: string;
  groupId: number;
  uploaderAddress: string;
  noteHash: string | null;
  sizeBytes: number;
  status: string;
  createdAt: Date;
}) {
  return {
    receiptId: row.id,
    groupId: String(row.groupId),
    uploader: checksumAddress(row.uploaderAddress),
    noteHash: row.noteHash,
    sizeBytes: row.sizeBytes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

/** /api/receipts — presign, confirm, and look up a receipt by its note hash. */
export function createReceiptRoutes(ctx: RouteContext): Router {
  const router = Router();
  router.use(requireAuth(ctx.env));

  const uploadLimit = apiRateLimit({
    windowMs: HOUR_MS,
    max: 30,
    code: "RATE_LIMITED",
    message: "Too many receipt uploads, try again later",
    keyGenerator: (req) => `upload:${req.auth?.address ?? ipKeyGenerator(req.ip ?? "unknown")}`,
  });

  router.post("/upload-url", uploadLimit, validate({ body: uploadBodySchema }), async (req, res) => {
    const groupId = req.body.groupId as string;
    const member = await ctx.membership.isMember(req.auth!.address, BigInt(groupId));
    if (!member) throw errors.forbidden("NOT_GROUP_MEMBER", "You are not a member of this group");

    const result = await createUploadUrl(ctx, {
      address: req.auth!.address,
      groupId,
      sizeBytes: req.body.sizeBytes as number,
    });
    res.status(201).json(result);
  });

  router.post("/:id/confirm", validate({ body: confirmBodySchema }), async (req, res) => {
    const result = await confirmReceipt(ctx, {
      address: req.auth!.address,
      receiptId: pathParam(req, "id"),
      noteHash: req.body.noteHash as string,
    });
    res.json(result);
  });

  router.get("/by-hash/:noteHash", validate({ params: noteHashParamsSchema }), async (req, res) => {
    const result = await findReceiptByNoteHash(ctx, {
      address: req.auth!.address,
      noteHash: pathParam(req, "noteHash"),
    });
    res.json(result);
  });

  return router;
}

/** /api/groups/:groupId/receipts — list-ready receipts of one group (members only). */
export function createGroupReceiptRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.get(
    "/:groupId/receipts",
    requireAuth(ctx.env),
    ctx.membership.middleware(),
    async (req, res) => {
      const rows = await ctx.repos.receipts.listByGroup(Number(req.groupId));
      res.json({ receipts: rows.map(serialize) });
    },
  );

  return router;
}

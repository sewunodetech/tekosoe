import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { ADDRESS_PATTERN, checksumAddress, normalizeAddress } from "../../lib/address";
import { errors } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const publicKeySchema = z.string().min(1).max(200);
const wrappedKeySchema = z.string().min(1).max(4000);

const myKeyBodySchema = z.object({ encPublicKey: publicKeySchema });

const wrapsBodySchema = z.object({
  wraps: z
    .array(
      z.object({
        member: z.string().regex(ADDRESS_PATTERN, "must be a 0x-prefixed address"),
        wrappedKey: wrappedKeySchema,
      }),
    )
    .min(1)
    .max(10),
});

/** /api/keys/me — publish my encryption public key. */
export function createKeysRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.put("/me", requireAuth(ctx.env), validate({ body: myKeyBodySchema }), async (req, res) => {
    const address = req.auth!.address;
    const encPublicKey = req.body.encPublicKey as string;
    await ctx.repos.memberEncKeys.upsert(address, encPublicKey);
    res.json({ address: checksumAddress(address), encPublicKey });
  });

  return router;
}

/** /api/groups/:groupId/keys and /key-wraps — key exchange for a group. */
export function createGroupKeysRoutes(ctx: RouteContext): Router {
  const router = Router();

  // GET — every member's published key (missing ones come back null).
  router.get(
    "/:groupId/keys",
    requireAuth(ctx.env),
    ctx.membership.middleware(),
    async (req, res) => {
      const groupId = BigInt(req.groupId!);
      const members = await ctx.chain.membersOf(groupId);
      const rows = await ctx.repos.memberEncKeys.listByAddresses(
        members.map((member) => member.toLowerCase()),
      );
      const byAddress = new Map(rows.map((row) => [row.address, row.encPublicKey]));
      res.json({
        keys: members.map((member) => ({
          address: checksumAddress(member),
          encPublicKey: byAddress.get(member.toLowerCase()) ?? null,
        })),
      });
    },
  );

  // PUT — publish wrapped copies of the group key for other members (insert-only).
  router.put(
    "/:groupId/key-wraps",
    requireAuth(ctx.env),
    ctx.membership.middleware(),
    validate({ body: wrapsBodySchema }),
    async (req, res) => {
      const groupId = Number(req.groupId);
      const caller = req.auth!.address;
      const wraps = req.body.wraps as { member: string; wrappedKey: string }[];

      const members = new Set(
        (await ctx.chain.membersOf(BigInt(groupId))).map((member) => member.toLowerCase()),
      );
      for (const wrap of wraps) {
        if (!members.has(wrap.member.toLowerCase())) {
          throw errors.forbidden(
            "NOT_GROUP_MEMBER",
            `Not a member of this group: ${checksumAddress(wrap.member)}`,
          );
        }
      }

      const created = await ctx.repos.groupKeyWraps.insertMany(
        wraps.map((wrap) => ({
          groupId,
          memberAddress: normalizeAddress(wrap.member),
          wrappedKey: wrap.wrappedKey,
          wrappedBy: caller,
        })),
      );
      res.json({ created, requested: wraps.length });
    },
  );

  // GET — my wrapped copy of the group key.
  router.get(
    "/:groupId/key-wraps/me",
    requireAuth(ctx.env),
    ctx.membership.middleware(),
    async (req, res) => {
      const wrap = await ctx.repos.groupKeyWraps.get(Number(req.groupId), req.auth!.address);
      if (!wrap) {
        throw errors.notFound(
          "KEY_WRAP_NOT_FOUND",
          "No wrapped key for you in this group yet",
        );
      }
      res.json({
        wrappedKey: wrap.wrappedKey,
        wrappedBy: checksumAddress(wrap.wrappedBy),
        createdAt: wrap.createdAt.toISOString(),
      });
    },
  );

  return router;
}

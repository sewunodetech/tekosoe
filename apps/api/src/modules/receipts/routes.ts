import { Router } from "express";
import { z } from "zod";
import { ipKeyGenerator } from "express-rate-limit";
import type { RouteContext } from "../../context";
import { checksumAddress } from "../../lib/address";
import { errors } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { apiRateLimit, HOUR_MS } from "../../middleware/rateLimit";
import { pathParam, validate } from "../../middleware/validate";
import { confirmReceipt, createUploadUrl, findReceiptByHash } from "./service";

const uploadBodySchema = z.object({
  groupId: z.string().regex(/^\d+$/, "must be a decimal group id"),
  spendId: z.string().regex(/^\d+$/, "must be a decimal spend id"),
  sizeBytes: z.number().int().positive(),
  /** Original file type (image/jpeg, application/pdf, ...); the stored bytes are ciphertext. */
  mime: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i, "must be a MIME type").max(64),
});

const receiptHashPattern = /^0x[0-9a-fA-F]{64}$/;

const confirmBodySchema = z.object({
  receiptHash: z.string().regex(receiptHashPattern, "must be a 32-byte hex hash"),
});

const receiptHashParamsSchema = z.object({
  receiptHash: z.string().regex(receiptHashPattern, "must be a 32-byte hex hash"),
});

function serialize(row: {
  id: string;
  groupId: number;
  spendId: number;
  uploaderAddress: string;
  mime: string;
  receiptHash: string | null;
  sizeBytes: number;
  status: string;
  createdAt: Date;
}) {
  return {
    receiptId: row.id,
    groupId: String(row.groupId),
    spendId: String(row.spendId),
    mime: row.mime,
    uploader: checksumAddress(row.uploaderAddress),
    receiptHash: row.receiptHash,
    sizeBytes: row.sizeBytes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

/** /api/receipts — presign, confirm, and look up a receipt by its receipt hash. */
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
      spendId: req.body.spendId as string,
      mime: req.body.mime as string,
      sizeBytes: req.body.sizeBytes as number,
    });
    res.status(201).json(result);
  });

  router.post("/:id/confirm", validate({ body: confirmBodySchema }), async (req, res) => {
    const result = await confirmReceipt(ctx, {
      address: req.auth!.address,
      receiptId: pathParam(req, "id"),
      receiptHash: req.body.receiptHash as string,
    });
    res.json(result);
  });

  router.get("/by-hash/:receiptHash", validate({ params: receiptHashParamsSchema }), async (req, res) => {
    const result = await findReceiptByHash(ctx, {
      address: req.auth!.address,
      receiptHash: pathParam(req, "receiptHash"),
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

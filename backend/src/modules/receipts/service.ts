import { randomUUID } from "node:crypto";
import { keccak256 } from "viem";
import type { RouteContext } from "../../context";
import { ApiError, errors } from "../../lib/errors";

const PRESIGN_TTL_SECONDS = 5 * 60;
const STALE_PENDING_MS = 60 * 60 * 1000;

function requireStorage(ctx: RouteContext) {
  if (!ctx.storage) {
    throw errors.notFound("FEATURE_DISABLED", "Receipts are not enabled on this deployment");
  }
  return ctx.storage;
}

/** Step 1 — create a pending row and a presigned PUT the device uploads to directly. */
export async function createUploadUrl(
  ctx: RouteContext,
  params: { address: string; groupId: string; sizeBytes: number },
) {
  const storage = requireStorage(ctx);

  if (params.sizeBytes > ctx.env.RECEIPT_MAX_BYTES) {
    throw new ApiError(
      413,
      "RECEIPT_TOO_LARGE",
      "Receipt is larger than the allowed size",
      { maxBytes: ctx.env.RECEIPT_MAX_BYTES },
    );
  }

  const storageKey = `receipts/${params.groupId}/${randomUUID()}`;
  const receipt = await ctx.repos.receipts.create({
    groupId: Number(params.groupId),
    uploaderAddress: params.address,
    storageKey,
    noteHash: null,
    sizeBytes: params.sizeBytes,
    status: "pending",
  });

  const { url, headers } = await storage.presignPut(storageKey, {
    contentType: "application/octet-stream",
    expiresIn: PRESIGN_TTL_SECONDS,
  });

  return {
    receiptId: receipt.id,
    uploadUrl: url,
    headers,
    expiresInSeconds: PRESIGN_TTL_SECONDS,
  };
}

/**
 * Step 2 — verify what actually landed in storage before marking it ready.
 * ASSUMPTION: noteHash is keccak256 of the ciphertext (RECEIPT_VERIFY_HASH=true);
 * confirm the definition with the mobile team (docs/coverage.md).
 */
export async function confirmReceipt(
  ctx: RouteContext,
  params: { address: string; receiptId: string; noteHash: string },
) {
  const storage = requireStorage(ctx);
  const receipt = await ctx.repos.receipts.get(params.receiptId);
  if (!receipt) throw errors.notFound("RECEIPT_NOT_FOUND", "Receipt not found");
  if (receipt.uploaderAddress !== params.address) {
    throw errors.forbidden("NOT_RECEIPT_OWNER", "Only the uploader can confirm this receipt");
  }
  if (receipt.status === "ready") {
    return { receiptId: receipt.id, status: "ready" as const };
  }

  const head = await storage.head(receipt.storageKey);
  if (!head) {
    throw errors.notFound("RECEIPT_NOT_UPLOADED", "Receipt has not been uploaded yet");
  }
  if (head.contentLength > ctx.env.RECEIPT_MAX_BYTES) {
    await storage.remove(receipt.storageKey).catch(() => undefined);
    throw errors.payloadTooLarge();
  }
  if (head.contentLength !== receipt.sizeBytes) {
    throw errors.validation({ reason: "size does not match the declared size" });
  }

  if (ctx.env.RECEIPT_VERIFY_HASH) {
    const bytes = await storage.getBytes(receipt.storageKey);
    if (!bytes) {
      throw errors.notFound("RECEIPT_NOT_UPLOADED", "Receipt has not been uploaded yet");
    }
    const hash = keccak256(bytes).toLowerCase();
    if (hash !== params.noteHash.toLowerCase()) {
      throw errors.validation({ reason: "noteHash does not match the uploaded bytes" });
    }
  }

  await ctx.repos.receipts.markReady(
    receipt.id,
    params.noteHash.toLowerCase(),
    head.contentLength,
  );
  return { receiptId: receipt.id, status: "ready" as const };
}

/** Step 3 — only members of the owning group get a download link. */
export async function findReceiptByNoteHash(
  ctx: RouteContext,
  params: { address: string; noteHash: string },
) {
  const storage = requireStorage(ctx);
  const receipt = await ctx.repos.receipts.getByNoteHash(params.noteHash.toLowerCase());
  if (!receipt) throw errors.notFound("RECEIPT_NOT_FOUND", "Receipt not found");

  const member = await ctx.membership.isMember(params.address, BigInt(receipt.groupId));
  if (!member) {
    throw errors.forbidden("NOT_GROUP_MEMBER", "You are not a member of this group");
  }

  const downloadUrl = await storage.presignGet(receipt.storageKey, PRESIGN_TTL_SECONDS);
  return {
    receiptId: receipt.id,
    groupId: String(receipt.groupId),
    sizeBytes: receipt.sizeBytes,
    downloadUrl,
  };
}

/** Step 5 — pending rows older than an hour are dropped together with their object. */
export async function cleanupStaleReceipts(ctx: RouteContext): Promise<number> {
  if (!ctx.storage) return 0;
  const cutoff = new Date(Date.now() - STALE_PENDING_MS);
  const stale = await ctx.repos.receipts.listStalePending(cutoff);

  for (const receipt of stale) {
    await ctx.storage.remove(receipt.storageKey).catch((error: unknown) => {
      ctx.logger.warn({ err: error, key: receipt.storageKey }, "could not remove stale object");
    });
    await ctx.repos.receipts.remove(receipt.id);
  }
  if (stale.length > 0) {
    ctx.logger.info({ removed: stale.length }, "stale pending receipts cleaned up");
  }
  return stale.length;
}

export function startReceiptCleanup(
  ctx: RouteContext,
  intervalMs = 60 * 60 * 1000,
): { stop(): void } {
  const timer = setInterval(() => {
    void cleanupStaleReceipts(ctx).catch((error: unknown) => {
      ctx.logger.error({ err: error }, "receipt cleanup failed");
    });
  }, intervalMs);
  return { stop: () => clearInterval(timer) };
}

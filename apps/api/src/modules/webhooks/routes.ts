import { createHmac, timingSafeEqual } from "node:crypto";
import express, { Router } from "express";
import { decodeEventLog, type Hex } from "viem";
import { groupVaultAbi } from "@tekosue/shared";
import type { RouteContext } from "../../context";
import { extractLogs } from "./extract";
import { handleGroupEvent } from "../notify/events";

/**
 * HMAC-SHA256 over the raw body compared with `x-alchemy-signature`.
 * Length is checked first so `timingSafeEqual` never throws.
 */
export function verifyAlchemySignature(
  rawBody: Buffer,
  header: string | undefined,
  signingKey: string,
): boolean {
  if (!signingKey || !header) return false;

  const expected = createHmac("sha256", signingKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header.trim().toLowerCase(), "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Process one webhook delivery: keep only logs emitted by the GroupVault contract,
 * dedupe through `processed_events` (Alchemy redelivers), decode, then notify.
 */
export async function handleAlchemyWebhook(
  ctx: RouteContext,
  rawBody: Buffer,
): Promise<void> {
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    ctx.logger.warn("alchemy webhook body is not valid JSON");
    return;
  }

  const contract = ctx.env.GROUP_VAULT_ADDRESS.toLowerCase();
  const logs = extractLogs(payload).filter((log) => log.address.toLowerCase() === contract);

  for (const log of logs) {
    if (!log.txHash) {
      ctx.logger.warn({ logIndex: log.logIndex }, "webhook log without transaction hash");
      continue;
    }

    const isNew = await ctx.repos.processedEvents.insertIfNew(log.txHash, log.logIndex);
    if (!isNew) continue;

    let decoded;
    try {
      decoded = decodeEventLog({
        abi: groupVaultAbi,
        data: log.data as Hex,
        topics: log.topics as [Hex, ...Hex[]],
      });
    } catch (error) {
      // Unknown selector or a log we do not act on — not worth an error.
      ctx.logger.debug(
        { err: error, txHash: log.txHash, logIndex: log.logIndex },
        "webhook log skipped",
      );
      continue;
    }

    await handleGroupEvent(ctx, { eventName: decoded.eventName, args: decoded.args as Record<string, unknown> }, log.txHash);
  }
}

export function createWebhookRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.post("/alchemy", express.raw({ type: "*/*", limit: "1mb" }), (req, res) => {
    const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

    if (!verifyAlchemySignature(raw, req.get("x-alchemy-signature"), ctx.env.ALCHEMY_WEBHOOK_SIGNING_KEY)) {
      res.status(401).json({
        error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature", details: {} },
      });
      return;
    }

    // Acknowledge immediately, process afterwards (spec 5.8).
    res.status(200).json({ received: true });

    const work = handleAlchemyWebhook(ctx, raw).catch((error: unknown) => {
      ctx.logger.error({ err: error }, "alchemy webhook processing failed");
    });
    ctx.onWebhookWork?.(work);
  });

  return router;
}

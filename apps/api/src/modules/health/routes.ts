import { Router } from "express";
import type { Request, Response } from "express";
import type { RouteContext } from "../../context";
import { checksumAddress } from "../../lib/address";
import { weiToMon } from "../../lib/money";
import { requireAdmin } from "../../middleware/adminKey";

/** Liveness probe for Railway — no dependencies, never fails. */
export function livenessHandler(_req: Request, res: Response): void {
  res.json({ status: "ok" });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createHealthRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.get("/status", requireAdmin(ctx.env), async (_req, res) => {
    const db = ctx.pingDb
      ? await ctx.pingDb().catch((error: unknown) => ({
          ok: false,
          latencyMs: null,
          error: errorMessage(error),
        }))
      : { ok: false, latencyMs: null, error: "database probe not configured" };

    let chain: {
      ok: boolean;
      chainId: number | null;
      latestBlockTimestamp: number | null;
      error?: string;
    };
    try {
      const [chainId, latestBlockTimestamp] = await Promise.all([
        ctx.chain.getChainId(),
        ctx.chain.getLatestBlockTimestamp(),
      ]);
      chain = { ok: true, chainId, latestBlockTimestamp };
    } catch (error) {
      chain = { ok: false, chainId: null, latestBlockTimestamp: null, error: errorMessage(error) };
    }

    const envio = await ctx.envio.ping();

    const wallet = async (address: string) => {
      try {
        const balance = await ctx.chain.getNativeBalance(address as `0x${string}`);
        const balanceMon = Number(weiToMon(balance).toFixed(4));
        return {
          address: checksumAddress(address),
          balanceMon,
          low: balanceMon < ctx.env.LOW_BALANCE_THRESHOLD_MON,
        };
      } catch (error) {
        return { address: checksumAddress(address), balanceMon: null, low: true, error: errorMessage(error) };
      }
    };

    const [drip, settler] = await Promise.all([
      wallet(ctx.chain.dripAddress),
      wallet(ctx.chain.settlerAddress),
    ]);

    const ok = db.ok && chain.ok && envio && !drip.low && !settler.low;

    res.json({
      status: ok ? "ok" : "degraded",
      db,
      chain,
      envio: { ok: envio },
      scheduler: {
        lastTickAt: ctx.scheduler.lastTickAt,
        lastTickDurationMs: ctx.scheduler.lastTickDurationMs,
        lastError: ctx.scheduler.lastError,
        dueCandidates: ctx.scheduler.dueCandidates,
        running: ctx.scheduler.running,
      },
      wallets: { drip, settler },
      features: {
        receipts: ctx.env.FEATURE_RECEIPTS,
        push: ctx.env.FEATURE_PUSH,
      },
    });
  });

  return router;
}

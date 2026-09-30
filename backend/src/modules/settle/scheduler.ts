import type { AppDeps } from "../../context";
import { fetchAllDueGroups } from "../../integrations/envio";
import { settleGroup, type SettleAttemptResult } from "./service";

export interface SweepResult {
  status: "completed" | "already_running" | "chain_unavailable" | "envio_unavailable";
  candidates?: number;
  processed?: number;
  results?: SettleAttemptResult[];
}

/**
 * One sweep: read the current block time, ask Envio which groups are due, then settle
 * them one by one (sequential, because the settler wallet has a single nonce).
 *
 * Never throws: a failing RPC or indexer only skips the tick and is retried later.
 * Safe to re-run — every step is idempotent, and a duplicate call can only cost gas.
 */
export async function runSettleSweep(ctx: AppDeps): Promise<SweepResult> {
  const state = ctx.scheduler;
  if (state.running) return { status: "already_running" };

  state.running = true;
  const started = Date.now();

  try {
    let now: number;
    try {
      now = await ctx.chain.getLatestBlockTimestamp();
    } catch (error) {
      state.lastError = `chain: ${error instanceof Error ? error.message : String(error)}`;
      ctx.logger.error({ err: error }, "settle sweep skipped: chain time unavailable");
      return { status: "chain_unavailable" };
    }

    let candidates;
    try {
      candidates = await fetchAllDueGroups(ctx.envio, now);
    } catch (error) {
      state.lastError = `envio: ${error instanceof Error ? error.message : String(error)}`;
      ctx.logger.error({ err: error }, "settle sweep skipped: indexer unavailable");
      return { status: "envio_unavailable" };
    }

    state.dueCandidates = candidates.length;
    const results: SettleAttemptResult[] = [];

    for (const candidate of candidates) {
      try {
        const groupId = BigInt(candidate.id);
        const run = await ctx.repos.settleRuns.get(Number(groupId));
        if (run?.nextAttemptAt && run.nextAttemptAt.getTime() > now * 1000) {
          continue; // still backing off
        }
        results.push(await settleGroup(ctx, groupId, { now }));
      } catch (error) {
        state.lastError = `group ${candidate.id}: ${error instanceof Error ? error.message : String(error)}`;
        ctx.logger.error({ err: error, groupId: candidate.id }, "settle candidate failed");
      }
    }

    state.lastError = null;
    return { status: "completed", candidates: candidates.length, processed: results.length, results };
  } finally {
    state.running = false;
    state.lastTickAt = new Date().toISOString();
    state.lastTickDurationMs = Date.now() - started;
  }
}

export interface SchedulerHandle {
  stop(): void;
}

/** setInterval inside the process — no cron, no serverless (see docs/03). */
export function startSettleScheduler(
  ctx: AppDeps,
  options: { intervalMs?: number; firstDelayMs?: number } = {},
): SchedulerHandle {
  const intervalMs = options.intervalMs ?? ctx.env.SETTLE_INTERVAL_MS;
  const firstDelayMs = options.firstDelayMs ?? 5_000;
  let interval: NodeJS.Timeout | undefined;

  const tick = () => {
    void runSettleSweep(ctx).catch((error: unknown) => {
      ctx.logger.error({ err: error }, "settle sweep crashed");
    });
  };

  const first = setTimeout(() => {
    tick();
    interval = setInterval(tick, intervalMs);
  }, firstDelayMs);

  return {
    stop() {
      clearTimeout(first);
      if (interval) clearInterval(interval);
    },
  };
}

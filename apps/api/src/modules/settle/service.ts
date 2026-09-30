import type { AppDeps } from "../../context";
import { GROUP_STATUS } from "@tekosoe/shared";
import type { Logger } from "../../lib/logger";
import { ensureInvoices } from "../invoices/service";

export interface SettleAttemptResult {
  groupId: string;
  status: "confirmed" | "skipped" | "failed" | "too_early" | "backoff";
  txHash?: string;
  error?: string;
  attempts?: number;
  durationMs: number;
}

const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 600_000;

/** 30s * 2^attempts, capped at 10 minutes. `attempts` is the count *before* this run. */
function backoffDelay(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** attempts, BACKOFF_MAX_MS);
}

/** Invoices never block settle: a failure here is retried by the sweep's backfill. */
async function tryInvoices(ctx: AppDeps, groupId: bigint, txHash?: string): Promise<void> {
  try {
    await ensureInvoices(ctx, groupId, txHash);
  } catch (error) {
    ctx.logger.warn({ err: error, groupId: groupId.toString() }, "invoice creation failed, will retry");
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function recordFailure(
  ctx: AppDeps,
  groupId: number,
  previousAttempts: number,
  reason: string,
): Promise<void> {
  const attempts = previousAttempts + 1;
  await ctx.repos.settleRuns.upsert({
    groupId,
    status: "failed",
    attempts,
    nextAttemptAt: new Date(Date.now() + backoffDelay(previousAttempts)),
    lastError: reason.slice(0, 500),
  });

  if (attempts >= ctx.env.SETTLE_ALERT_ATTEMPTS) {
    ctx.logger.error(
      { alert: true, groupId, attempts },
      "settle attempts exceeded the alert threshold",
    );
  }
}

/**
 * FR-11: settle one group. Steps 4–7 of the sweep, exposed so the admin trigger can
 * run them for a single group right now (ignoring backoff).
 *
 * Time comes from the latest block, because the contract compares against
 * block.timestamp — not the server clock.
 */
export async function settleGroup(
  ctx: AppDeps,
  groupId: bigint,
  options: { now?: number; ignoreBackoff?: boolean } = {},
): Promise<SettleAttemptResult> {
  const started = Date.now();
  const id = Number(groupId);
  const logger: Logger = ctx.logger;
  const finish = (
    status: SettleAttemptResult["status"],
    extra: Partial<SettleAttemptResult> = {},
  ): SettleAttemptResult => ({
    groupId: groupId.toString(),
    status,
    durationMs: Date.now() - started,
    ...extra,
  });

  let now = options.now;
  if (now === undefined) {
    try {
      now = await ctx.chain.getLatestBlockTimestamp();
    } catch (error) {
      logger.error({ err: error, groupId: groupId.toString() }, "could not read chain time");
      return finish("failed", { error: "chain time unavailable" });
    }
  }

  const run = await ctx.repos.settleRuns.get(id);
  if (
    !options.ignoreBackoff &&
    run?.nextAttemptAt &&
    run.nextAttemptAt.getTime() > now * 1000
  ) {
    return finish("backoff");
  }

  let group;
  try {
    group = await ctx.chain.getGroup(groupId);
  } catch (error) {
    const reason = errorMessage(error);
    logger.error({ err: error, groupId: groupId.toString() }, "getGroup failed");
    await recordFailure(ctx, id, run?.attempts ?? 0, reason);
    return finish("failed", { error: reason, attempts: (run?.attempts ?? 0) + 1 });
  }

  if (group.status !== GROUP_STATUS.Active) {
    await ctx.repos.settleRuns.upsert({ groupId: id, status: "skipped" });
    logger.info({ groupId: groupId.toString(), durationMs: Date.now() - started, status: "skipped" }, "settle skipped");
    await tryInvoices(ctx, groupId);
    return finish("skipped");
  }

  // disputeWindow is not present on the Envio Group entity — read it from the contract.
  if (now < group.endsAt + group.disputeWindow) {
    return finish("too_early");
  }

  const simulation = await ctx.chain.simulateSettle(groupId);
  if (!simulation.ok) {
    if (simulation.alreadySettled) {
      await ctx.repos.settleRuns.upsert({ groupId: id, status: "skipped" });
      logger.info(
        { groupId: groupId.toString(), durationMs: Date.now() - started, status: "skipped" },
        "settle skipped",
      );
      await tryInvoices(ctx, groupId);
      return finish("skipped", { error: simulation.reason });
    }
    await recordFailure(ctx, id, run?.attempts ?? 0, simulation.reason);
    logger.warn(
      { groupId: groupId.toString(), durationMs: Date.now() - started, status: "failed" },
      "settle simulation failed",
    );
    return finish("failed", { error: simulation.reason, attempts: (run?.attempts ?? 0) + 1 });
  }

  const attempts = (run?.attempts ?? 0) + 1;
  await ctx.repos.settleRuns.upsert({ groupId: id, status: "submitted", attempts });

  let sent: { hash: string; ok: boolean };
  try {
    sent = await ctx.chain.sendSettle(groupId);
  } catch (error) {
    const reason = errorMessage(error);
    await recordFailure(ctx, id, run?.attempts ?? 0, reason);
    logger.error({ err: error, groupId: groupId.toString() }, "settle send failed");
    return finish("failed", { error: reason, attempts });
  }

  if (!sent.ok) {
    await recordFailure(ctx, id, run?.attempts ?? 0, "settle transaction reverted");
    return finish("failed", { error: "settle transaction reverted", attempts });
  }

  await ctx.repos.settleRuns.upsert({
    groupId: id,
    status: "confirmed",
    attempts,
    txHash: sent.hash,
    lastError: null,
  });
  logger.info(
    { groupId: groupId.toString(), txHash: sent.hash, durationMs: Date.now() - started, status: "confirmed" },
    "settle confirmed",
  );
  await tryInvoices(ctx, groupId, sent.hash);
  return finish("confirmed", { txHash: sent.hash, attempts });
}

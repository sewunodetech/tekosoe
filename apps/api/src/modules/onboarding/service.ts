import type { RouteContext } from "../../context";
import type { Address } from "viem";
import { parseMonAmount } from "../../lib/money";

export type DripOutcome =
  | { status: "already_funded" }
  | { status: "sufficient_balance" }
  | { status: "funded"; txHash: string }
  | { status: "limit_reached" }
  | { status: "in_progress" }
  | { status: "failed"; error: string };

function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * FR-03 / US-01: brand new accounts have no MON, so the very first transaction
 * (join + deposit) would fail. This sends a small fixed amount and only answers
 * "funded" after the transaction is confirmed. An address that was funded before is
 * refilled only when it is below DRIP_MIN_BALANCE_MON and its last drip is older than
 * DRIP_REFILL_COOLDOWN_MINUTES, so users never run out of network fees mid-trip.
 *
 * The endpoint is unauthenticated (the account does not exist yet), so it is
 * protected by: per-IP rate limit, a global daily cap, one claim per address at a
 * time with a refill cooldown, and a minimum-balance check.
 */
export async function requestDrip(
  ctx: RouteContext,
  address: string,
): Promise<DripOutcome> {
  const { repos, chain, env } = ctx;
  const lower = address.toLowerCase() as Address;

  const existing = await repos.gasDrips.get(lower);
  if (existing?.status === "confirmed") {
    // Refill: an active member spends the first drip after a dozen or so payments. Top them up
    // again only when they are nearly empty and the last drip is older than the cooldown; the
    // per-IP rate limit and the daily cap still apply below.
    const cooledDown =
      Date.now() - existing.createdAt.getTime() >= env.DRIP_REFILL_COOLDOWN_MINUTES * 60_000;
    if (!cooledDown) return { status: "already_funded" };
    let balance: bigint;
    try {
      balance = await chain.getNativeBalance(lower);
    } catch {
      return { status: "already_funded" };
    }
    if (balance >= parseMonAmount(env.DRIP_MIN_BALANCE_MON)) return { status: "already_funded" };
    await repos.gasDrips.release(lower);
  }

  const dripsToday = await repos.gasDrips.countSince(startOfUtcDay());
  if (dripsToday >= env.DRIP_DAILY_CAP) {
    return { status: "limit_reached" };
  }

  try {
    const balance = await chain.getNativeBalance(lower);
    if (balance >= parseMonAmount(env.DRIP_MIN_BALANCE_MON)) {
      return { status: "sufficient_balance" };
    }
  } catch (error) {
    ctx.logger.warn({ err: error, address: lower }, "could not read balance before drip");
  }

  const amountWei = parseMonAmount(env.DRIP_AMOUNT_MON);
  const claimed = await repos.gasDrips.claim(lower, amountWei);
  if (!claimed) {
    const row = await repos.gasDrips.get(lower);
    return row?.status === "confirmed"
      ? { status: "already_funded" }
      : { status: "in_progress" };
  }

  try {
    const txHash = await chain.sendDrip(lower, amountWei);
    await repos.gasDrips.confirm(lower, txHash);
    return { status: "funded", txHash };
  } catch (error) {
    // Release the claim so the address can try again.
    await repos.gasDrips.release(lower).catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    ctx.logger.error({ err: error, address: lower }, "drip failed");
    return { status: "failed", error: message };
  }
}

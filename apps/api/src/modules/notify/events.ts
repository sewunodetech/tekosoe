import type { AppDeps } from "../../context";
import { ensureInvoices } from "../invoices/service";
import { buildNotifyPlan, sendPlan, type DecodedGroupEvent } from "./plan";

/**
 * Everything the api does when a GroupVault event is seen, whatever the source (Envio poller or
 * Alchemy webhook). The caller dedupes by (txHash, logIndex) first. Never throws.
 */
export async function handleGroupEvent(ctx: AppDeps, event: DecodedGroupEvent, txHash: string): Promise<void> {
  const groupId = BigInt(String(event.args.groupId));

  if (event.eventName === "DebtPaid") {
    // Invoice "due" → "paid" once the paid amount covers the remaining debt.
    await ctx.repos.invoices
      .recordDebtPaid(Number(groupId), String(event.args.member).toLowerCase(), BigInt(String(event.args.amount)))
      .catch((error: unknown) => {
        ctx.logger.error({ err: error, txHash }, "could not record DebtPaid on invoice");
      });
  }
  if (event.eventName === "Settled") {
    // Covers groups settled by a member instead of our scheduler.
    await ensureInvoices(ctx, groupId, txHash).catch((error: unknown) => {
      ctx.logger.error({ err: error, txHash }, "could not create invoices for settled group");
    });
  }

  if (!ctx.push) return;
  try {
    const plan = await buildNotifyPlan(ctx, event);
    if (plan) await sendPlan(ctx, plan);
  } catch (error) {
    ctx.logger.error({ err: error, eventName: event.eventName }, "notification dispatch failed");
  }
}

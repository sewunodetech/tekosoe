import type { AppDeps } from "../../context";
import type { ActivityRow } from "../../integrations/envio";
import { formatAusd } from "../../lib/money";
import { handleGroupEvent } from "./events";
import { resolveTripName, sendPlan, type DecodedGroupEvent } from "./plan";

/**
 * Notification source from Envio (ADR 0014): poll new `Activity` rows, turn them into the same
 * decoded events the Alchemy webhook produced, and run them through `handleGroupEvent`.
 * Also sends a daily reminder to members who still owe after a settle-up (ADR 0013).
 */

const CURSOR_KEY = "notify:envio:cursor";
const PAGE = 200;
const REMINDER_CHECK_MS = 5 * 60_000;

const reminderKey = (groupId: string, address: string) => `debt-reminder:${groupId}:${address}`;

/** Activity row → decoded event args (names as in the GroupVault ABI). Null for events we ignore. */
export async function eventFromActivity(deps: AppDeps, row: ActivityRow): Promise<DecodedGroupEvent | null> {
  const base = { groupId: BigInt(row.groupId) };
  const amount = row.amount ?? 0n;
  switch (row.type) {
    case "SpendRequested":
      return { eventName: row.type, args: { ...base, spendId: row.spendId, spender: row.actor, amount } };
    case "SpendExecuted": {
      const shares = row.spendId === null ? [] : await deps.envio.spendShares(row.groupId, row.spendId);
      return {
        eventName: row.type,
        args: {
          ...base,
          spendId: row.spendId,
          spender: row.actor,
          amount,
          participants: shares.map((s) => s.participant),
          shares: shares.map((s) => s.share),
        },
      };
    }
    case "SpendRejected":
      return { eventName: row.type, args: { ...base, spendId: row.spendId, by: row.actor } };
    case "ShareDisputed":
      return { eventName: row.type, args: { ...base, spendId: row.spendId, participant: row.actor, share: amount } };
    case "Settled":
      return { eventName: row.type, args: base };
    case "Pulled":
      return { eventName: row.type, args: { ...base, member: row.actor, amount, remainingDebt: row.remaining ?? 0n } };
    case "Refunded":
      return { eventName: row.type, args: { ...base, member: row.actor, amount, remainingCredit: row.remaining ?? 0n } };
    case "DebtPaid":
      return { eventName: row.type, args: { ...base, member: row.actor, amount } };
    default:
      return null;
  }
}

const logIndexOf = (id: string) => Number(id.slice(id.lastIndexOf("-") + 1));

/**
 * One poll. The first run only stores "now" as the cursor, so history is never replayed as pushes.
 * Rows at the cursor second are fetched again on purpose; `processed_events` drops the repeats.
 */
export async function runNotifySweep(deps: AppDeps, now: number): Promise<{ handled: number }> {
  const stored = await deps.repos.kvState.get(CURSOR_KEY);
  if (stored === null) {
    await deps.repos.kvState.set(CURSOR_KEY, String(now));
    return { handled: 0 };
  }

  const rows = await deps.envio.activitiesSince(Number(stored), PAGE);
  let cursor = Number(stored);
  let handled = 0;
  for (const row of rows) {
    cursor = Math.max(cursor, row.timestamp);
    if (!(await deps.repos.processedEvents.insertIfNew(row.txHash, logIndexOf(row.id)))) continue;
    const event = await eventFromActivity(deps, row);
    if (!event) continue;
    await handleGroupEvent(deps, event, row.txHash);
    handled += 1;
  }
  if (cursor !== Number(stored)) await deps.repos.kvState.set(CURSOR_KEY, String(cursor));
  return { handled };
}

/**
 * "You still owe $X" at most once per `DEBT_REMINDER_HOURS` per (trip, member). The clock starts
 * when the debt is first seen: the settle-up push already told them the same day.
 */
export async function runDebtReminders(deps: AppDeps, now: number): Promise<{ sent: number }> {
  if (!deps.push) return { sent: 0 };
  const every = deps.env.DEBT_REMINDER_HOURS * 3600;
  let sent = 0;
  for (const debt of await deps.envio.openDebts(500)) {
    const key = reminderKey(debt.groupId, debt.address);
    const last = await deps.repos.kvState.get(key);
    if (last === null) {
      await deps.repos.kvState.set(key, String(now));
      continue;
    }
    if (now - Number(last) < every) continue;
    const groupId = BigInt(debt.groupId);
    const trip = await resolveTripName(deps, groupId);
    sent += await sendPlan(deps, {
      groupId,
      title: trip,
      tag: `DebtReminder:${debt.groupId}:${debt.address}`,
      url: `/trip/${debt.groupId}/invoice`,
      bodies: new Map([
        [debt.address, `You still owe ${formatAusd(debt.debt)} from ${trip}. Pay it to start or join your next trip.`],
      ]),
    });
    await deps.repos.kvState.set(key, String(now));
  }
  return { sent };
}

/** setInterval job like the settle scheduler. Never throws; a failed tick is retried next time. */
export function startEnvioNotifier(deps: AppDeps, options: { intervalMs?: number } = {}): { stop(): void } {
  const intervalMs = options.intervalMs ?? deps.env.NOTIFY_INTERVAL_MS;
  let running = false;
  let lastReminderCheck = 0;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const now = Math.floor(Date.now() / 1000);
      await runNotifySweep(deps, now);
      if (Date.now() - lastReminderCheck >= REMINDER_CHECK_MS) {
        lastReminderCheck = Date.now();
        await runDebtReminders(deps, now);
      }
    } catch (error) {
      deps.logger.warn({ err: error }, "notify sweep failed");
    } finally {
      running = false;
    }
  };

  const interval = setInterval(() => void tick(), intervalMs);
  const first = setTimeout(() => void tick(), 3_000);
  return {
    stop() {
      clearTimeout(first);
      clearInterval(interval);
    },
  };
}

import type { AppDeps } from "../../context";
import { formatAusd } from "../../lib/money";

/**
 * Event → push notification mapping. Copy is English like the app, and never uses crypto
 * terms (no wallet, gas, token, hash, transaction — NFR-07). Each plan links into the app
 * (`/trip/...` routes in apps/mobile). Fed by the Envio poller (ADR 0014) or the optional
 * Alchemy webhook; both go through `handleGroupEvent`.
 */

export interface DecodedGroupEvent {
  eventName: string;
  args: Record<string, unknown>;
}

export interface NotifyPlan {
  groupId: bigint;
  title: string;
  tag: string;
  url: string;
  /** Lowercase address → body. Bodies can differ per recipient (shares, names). */
  bodies: Map<string, string>;
}

const SOMEONE = "Someone";

function big(value: unknown, fallback = 0n): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string" && value !== "") return BigInt(value);
  return fallback;
}

function addr(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

function addresses(value: unknown): string[] {
  return Array.isArray(value) ? value.map(addr).filter(Boolean) : [];
}

/** Trip name as the app shows it: the creator's name from metadata, else the on-chain name. */
export async function resolveTripName(ctx: AppDeps, groupId: bigint): Promise<string> {
  try {
    const meta = await ctx.repos.groupMeta.get(Number(groupId));
    if (meta?.name) return meta.name;
  } catch {
    // fall through to the chain
  }
  try {
    const group = await ctx.chain.getGroup(groupId);
    return group.name || "Your trip";
  } catch {
    return "Your trip";
  }
}

async function loadNames(ctx: AppDeps, members: string[]): Promise<Map<string, string>> {
  if (members.length === 0) return new Map();
  try {
    const rows = await ctx.repos.profiles.list([...new Set(members)]);
    return new Map(rows.map((row) => [row.address, row.displayName]));
  } catch {
    return new Map();
  }
}

function displayName(names: Map<string, string>, address: string): string {
  return names.get(address) ?? SOMEONE;
}

/** Build the per-recipient bodies for one event. Returns null when the event does not notify. */
export async function buildNotifyPlan(ctx: AppDeps, event: DecodedGroupEvent): Promise<NotifyPlan | null> {
  const groupId = big(event.args.groupId);
  const spendId = big(event.args.spendId, -1n);
  const trip = await resolveTripName(ctx, groupId);
  const bodies = new Map<string, string>();
  const tagParts = [event.eventName, groupId.toString()];
  const tripUrl = `/trip/${groupId}`;
  let url = tripUrl;

  switch (event.eventName) {
    case "SpendRequested": {
      const spender = addr(event.args.spender);
      const amount = big(event.args.amount);
      const members = addresses(await ctx.chain.membersOf(groupId)).filter((member) => member !== spender);
      const names = await loadNames(ctx, [...members, spender]);
      const body = `${displayName(names, spender)} wants to pay ${formatAusd(amount)} from the pot. Tap to approve.`;
      for (const member of members) bodies.set(member, body);
      if (spendId >= 0n) {
        tagParts.push(spendId.toString());
        url = `${tripUrl}/spend/${spendId}/approve`;
      }
      break;
    }

    case "SpendExecuted": {
      const spender = addr(event.args.spender);
      const amount = big(event.args.amount);
      const participants = addresses(event.args.participants);
      const shares = Array.isArray(event.args.shares) ? event.args.shares : [];
      const names = await loadNames(ctx, [spender]);
      const who = displayName(names, spender);
      participants
        .filter((member) => member !== spender)
        .forEach((member) => {
          const index = participants.indexOf(member);
          const share = participants.length === shares.length ? big(shares[index]) : null;
          bodies.set(
            member,
            share === null
              ? `${who} paid ${formatAusd(amount)} from the pot.`
              : `${who} paid ${formatAusd(amount)} from the pot. Your share is ${formatAusd(share)}.`,
          );
        });
      if (spendId >= 0n) {
        tagParts.push(spendId.toString());
        url = `${tripUrl}/spend/${spendId}`;
      }
      break;
    }

    case "SpendRejected": {
      const spend = await ctx.chain.getSpend(groupId, big(event.args.spendId));
      bodies.set(addr(spend.spender), `Your payment of ${formatAusd(spend.amount)} was declined.`);
      tagParts.push(big(event.args.spendId).toString());
      break;
    }

    case "ShareDisputed": {
      const spend = await ctx.chain.getSpend(groupId, big(event.args.spendId));
      const participant = addr(event.args.participant);
      const names = await loadNames(ctx, [participant]);
      bodies.set(
        addr(spend.spender),
        `${displayName(names, participant)} wasn't part of a payment, so their ${formatAusd(big(event.args.share))} moved to you.`,
      );
      tagParts.push(big(event.args.spendId).toString());
      url = `${tripUrl}/spend/${big(event.args.spendId)}`;
      break;
    }

    case "Settled": {
      const members = addresses(await ctx.chain.membersOf(groupId));
      for (const member of members) bodies.set(member, "Settle-up is done. See how it evened out.");
      url = `${tripUrl}/settled`;
      break;
    }

    case "Pulled": {
      const member = addr(event.args.member);
      const amount = big(event.args.amount);
      const remaining = big(event.args.remainingDebt);
      bodies.set(
        member,
        remaining > 0n
          ? `Your safety net covered ${formatAusd(amount)}. You still owe ${formatAusd(remaining)}. Pay it to start your next trip.`
          : `Your safety net covered the ${formatAusd(amount)} you were short. You're all square.`,
      );
      tagParts.push(member);
      url = `${tripUrl}/invoice`;
      break;
    }

    case "Refunded": {
      const member = addr(event.args.member);
      const amount = big(event.args.amount);
      if (amount === 0n) break; // only the credit bookkeeping changed
      bodies.set(member, `You got ${formatAusd(amount)} back from the pot.`);
      tagParts.push(member);
      url = `${tripUrl}/invoice`;
      break;
    }

    default:
      return null;
  }

  if (bodies.size === 0) return null;

  return { groupId, title: trip, url, tag: tagParts.join(":"), bodies };
}

/**
 * Deliver a plan to every recipient that has registered an Expo push token.
 * Never throws: one broken token must not stop the rest.
 */
export async function sendPlan(ctx: AppDeps, plan: NotifyPlan): Promise<number> {
  if (!ctx.push) return 0;

  const recipients = [...plan.bodies.keys()];
  if (recipients.length === 0) return 0;

  let subs;
  try {
    subs = await ctx.repos.pushSubs.listByAddresses(recipients);
  } catch (error) {
    ctx.logger.error({ err: error }, "could not load push tokens");
    return 0;
  }

  const messages = subs.flatMap((sub) => {
    const body = plan.bodies.get(sub.address);
    return body
      ? [{ to: sub.expoPushToken, title: plan.title, body, data: { url: plan.url, tag: plan.tag } }]
      : [];
  });
  const results = await ctx.push.sendMany(messages);

  let sent = 0;
  for (const [index, result] of results.entries()) {
    if (result === "sent") sent += 1;
    if (result === "gone") {
      const token = messages[index]!.to;
      await ctx.repos.pushSubs.deleteToken(token).catch((error: unknown) => {
        ctx.logger.warn({ err: error }, "could not remove dead push token");
      });
      ctx.logger.info("removed dead push token");
    }
  }

  ctx.logger.info(
    { groupId: plan.groupId.toString(), tag: plan.tag, recipients: recipients.length, sent },
    "push notifications dispatched",
  );
  return sent;
}

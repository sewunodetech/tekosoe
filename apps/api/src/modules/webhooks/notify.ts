import type { RouteContext } from "../../context";
import { formatAusd } from "../../lib/money";

/**
 * Event → notification mapping from the backend spec (all copy is Indonesian and
 * never mentions crypto terms, NFR-07). Every message ends up as a small
 * `{ title, body, url, tag }` push payload.
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

const ANONYMOUS = "Seorang anggota";

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

async function resolveGroup(ctx: RouteContext, groupId: bigint): Promise<string> {
  try {
    const group = await ctx.chain.getGroup(groupId);
    return group.name || `kas #${groupId}`;
  } catch {
    return `kas #${groupId}`;
  }
}

async function loadNames(
  ctx: RouteContext,
  members: string[],
): Promise<Map<string, string>> {
  if (members.length === 0) return new Map();
  try {
    const rows = await ctx.repos.profiles.list([...new Set(members)]);
    return new Map(rows.map((row) => [row.address, row.displayName]));
  } catch {
    return new Map();
  }
}

function displayName(names: Map<string, string>, address: string): string {
  return names.get(address) ?? ANONYMOUS;
}

/** Build the per-recipient bodies for one decoded event. Returns null when the event does not notify. */
export async function buildNotifyPlan(
  ctx: RouteContext,
  event: DecodedGroupEvent,
): Promise<NotifyPlan | null> {
  const groupId = big(event.args.groupId);
  const spendId = big(event.args.spendId, -1n);
  const groupName = await resolveGroup(ctx, groupId);
  const bodies = new Map<string, string>();
  const tagParts = [event.eventName, groupId.toString()];

  switch (event.eventName) {
    case "SpendRequested": {
      const spender = addr(event.args.spender);
      const amount = big(event.args.amount);
      const members = addresses(await ctx.chain.membersOf(groupId)).filter(
        (member) => member !== spender,
      );
      const names = await loadNames(ctx, [...members, spender]);
      const sender = displayName(names, spender);
      for (const member of members) {
        bodies.set(
          member,
          `Butuh persetujuanmu: ${sender} ingin memakai ${formatAusd(amount)} dari kas ${groupName}.`,
        );
      }
      if (spendId >= 0n) tagParts.push(spendId.toString());
      break;
    }

    case "SpendExecuted": {
      const spender = addr(event.args.spender);
      const amount = big(event.args.amount);
      const participants = addresses(event.args.participants);
      const shares = Array.isArray(event.args.shares) ? event.args.shares : [];
      const members = participants.filter((member) => member !== spender);
      members.forEach((member, index) => {
        const share = participants.length === shares.length ? big(shares[index]) : null;
        bodies.set(
          member,
          share === null
            ? `Pemakaian baru ${formatAusd(amount)} di ${groupName}.`
            : `Pemakaian baru ${formatAusd(amount)} di ${groupName}. Bagianmu ${formatAusd(share)}.`,
        );
      });
      if (spendId >= 0n) tagParts.push(spendId.toString());
      break;
    }

    case "SpendRejected": {
      const spend = await ctx.chain.getSpend(groupId, big(event.args.spendId));
      const spender = addr(spend.spender);
      bodies.set(spender, `Pemakaianmu di ${groupName} ditolak.`);
      tagParts.push(big(event.args.spendId).toString());
      break;
    }

    case "ShareDisputed": {
      const spend = await ctx.chain.getSpend(groupId, big(event.args.spendId));
      const spender = addr(spend.spender);
      const participant = addr(event.args.participant);
      const share = big(event.args.share);
      const names = await loadNames(ctx, [participant]);
      bodies.set(
        spender,
        `${displayName(names, participant)} menolak bagiannya sebesar ${formatAusd(share)} di ${groupName}.`,
      );
      tagParts.push(big(event.args.spendId).toString());
      break;
    }

    case "Settled": {
      const members = addresses(await ctx.chain.membersOf(groupId));
      const body = `Settle-up ${groupName} sudah selesai. Lihat hasilnya.`;
      for (const member of members) bodies.set(member, body);
      break;
    }

    case "Pulled": {
      const member = addr(event.args.member);
      const amount = big(event.args.amount);
      const remaining = big(event.args.remainingDebt);
      let body = `Kekuranganmu ${formatAusd(amount)} di ${groupName} sudah diselesaikan.`;
      if (remaining > 0n) body += ` Masih ada tagihan ${formatAusd(remaining)}.`;
      bodies.set(member, body);
      tagParts.push(member);
      break;
    }

    case "Refunded": {
      const member = addr(event.args.member);
      const amount = big(event.args.amount);
      bodies.set(member, `Kamu menerima ${formatAusd(amount)} dari kas ${groupName}.`);
      tagParts.push(member);
      break;
    }

    default:
      return null;
  }

  if (bodies.size === 0) return null;

  return {
    groupId,
    title: groupName,
    url: `/groups/${groupId}`,
    tag: tagParts.join(":"),
    bodies,
  };
}

/**
 * Deliver a plan to every recipient that has registered an Expo push token.
 * Never throws: one broken token must not stop the rest.
 */
export async function sendPlan(ctx: RouteContext, plan: NotifyPlan): Promise<number> {
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

/** Decode → plan → send. Defensive: always resolves so webhook processing never dies. */
export async function dispatchEvent(
  ctx: RouteContext,
  event: DecodedGroupEvent,
): Promise<void> {
  try {
    if (!ctx.push) return;
    const plan = await buildNotifyPlan(ctx, event);
    if (!plan) return;
    await sendPlan(ctx, plan);
  } catch (error) {
    ctx.logger.error({ err: error, eventName: event.eventName }, "notification dispatch failed");
  }
}

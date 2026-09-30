/**
 * Handler Envio v3 untuk GroupVault v1 (ADR 0005).
 *
 * Aturan saldo sama persis dengan kontrak:
 * - Member.net = deposited − used (termasuk efek ShareDisputed).
 * - Group.pool: + Deposited, − SpendExecuted, + Pulled, − Refunded, + DebtPaid.
 *   (payDebt: DebtPaid masuk ke kas, lalu tiap Refunded keluar; yang gagal dibayar tetap di kas.)
 * - Member.debt/credit mengikuti remainingDebt/remainingCredit dari event; DebtPaid mengurangi debt.
 * Setiap event juga menulis satu baris Activity untuk feed.
 */
import { indexer, type EvmOnEventContext, type Member } from "envio";

type Ctx = EvmOnEventContext;

interface EventMeta {
  block: { timestamp: number };
  transaction: { hash: string; from?: string };
  logIndex: number;
}

const lower = (address: string) => address.toLowerCase();
const memberId = (groupId: bigint, address: string) => `${groupId}-${lower(address)}`;
const spendKey = (groupId: bigint, spendId: bigint) => `${groupId}-${spendId}`;
const shareId = (groupId: bigint, spendId: bigint, participant: string) =>
  `${groupId}-${spendId}-${lower(participant)}`;
const eventId = (event: EventMeta) => `${event.transaction.hash}-${event.logIndex}`;

async function member(context: Ctx, groupId: bigint, address: string): Promise<Member> {
  return context.Member.getOrThrow(memberId(groupId, address), `member ${address} of group ${groupId}`);
}

function withUsed(m: Member, used: bigint): Member {
  return { ...m, used, net: m.deposited - used };
}

async function addToPool(context: Ctx, groupId: bigint, delta: bigint): Promise<void> {
  const group = await context.Group.getOrThrow(groupId.toString());
  context.Group.set({ ...group, pool: group.pool + delta });
}

function activity(
  context: Ctx,
  event: EventMeta,
  groupId: bigint,
  type: string,
  actor: string,
  extra: { counterparty?: string; amount?: bigint; spendId?: bigint } = {},
): void {
  context.Activity.set({
    id: eventId(event),
    group_id: groupId.toString(),
    type,
    actor: lower(actor),
    counterparty: extra.counterparty ? lower(extra.counterparty) : undefined,
    amount: extra.amount,
    spendId: extra.spendId,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  });
}

/** Writes the Spend + SpendShare rows; shared by SpendRequested and a direct SpendExecuted. */
function writeSpend(
  context: Ctx,
  event: EventMeta,
  p: {
    groupId: bigint;
    spendId: bigint;
    spender: string;
    to: string;
    amount: bigint;
    participants: readonly string[];
    shares: readonly bigint[];
    noteHash: string;
  },
  status: "Pending" | "Executed",
): void {
  const id = spendKey(p.groupId, p.spendId);
  const timestamp = BigInt(event.block.timestamp);
  context.Spend.set({
    id,
    group_id: p.groupId.toString(),
    spendId: p.spendId,
    spender: lower(p.spender),
    to: lower(p.to),
    amount: p.amount,
    status,
    noteHash: p.noteHash,
    requestedAt: timestamp,
    executedAt: status === "Executed" ? timestamp : undefined,
    receiptCount: 0,
  });
  p.participants.forEach((participant, i) => {
    context.SpendShare.set({
      id: shareId(p.groupId, p.spendId, participant),
      spend_id: id,
      participant: lower(participant),
      share: p.shares[i] ?? 0n,
      disputed: false,
    });
  });
}

indexer.onEvent({ contract: "GroupVault", event: "GroupCreated" }, async ({ event, context }) => {
  const p = event.params;
  context.Group.set({
    id: p.groupId.toString(),
    name: p.name,
    creator: lower(p.creator),
    endsAt: p.endsAt,
    disputeWindow: p.disputeWindow,
    approvalThreshold: p.approvalThreshold,
    pool: 0n,
    status: "Active",
    memberCount: 0,
    createdAt: BigInt(event.block.timestamp),
    settledAt: undefined,
    settleTxHash: undefined,
  });
  activity(context, event, p.groupId, "GroupCreated", p.creator);
});

indexer.onEvent({ contract: "GroupVault", event: "MemberJoined" }, async ({ event, context }) => {
  const p = event.params;
  const group = await context.Group.getOrThrow(p.groupId.toString());
  context.Group.set({ ...group, memberCount: group.memberCount + 1 });
  context.Member.set({
    id: memberId(p.groupId, p.member),
    group_id: p.groupId.toString(),
    address: lower(p.member),
    deposited: 0n,
    used: 0n,
    net: 0n,
    pullCap: p.pullCap,
    pulled: 0n,
    refunded: 0n,
    debt: 0n,
    credit: 0n,
    joinedAt: BigInt(event.block.timestamp),
  });
  activity(context, event, p.groupId, "MemberJoined", p.member, { amount: p.pullCap });
});

indexer.onEvent({ contract: "GroupVault", event: "Deposited" }, async ({ event, context }) => {
  const p = event.params;
  const m = await member(context, p.groupId, p.member);
  const deposited = m.deposited + p.amount;
  context.Member.set({ ...m, deposited, net: deposited - m.used });
  await addToPool(context, p.groupId, p.amount);
  activity(context, event, p.groupId, "Deposited", p.member, { amount: p.amount });
});

indexer.onEvent({ contract: "GroupVault", event: "SpendRequested" }, async ({ event, context }) => {
  const p = event.params;
  writeSpend(context, event, p, "Pending");
  activity(context, event, p.groupId, "SpendRequested", p.spender, {
    counterparty: p.to,
    amount: p.amount,
    spendId: p.spendId,
  });
});

indexer.onEvent({ contract: "GroupVault", event: "SpendExecuted" }, async ({ event, context }) => {
  const p = event.params;
  const id = spendKey(p.groupId, p.spendId);
  const existing = await context.Spend.get(id);
  if (existing) {
    context.Spend.set({ ...existing, status: "Executed", executedAt: BigInt(event.block.timestamp) });
  } else {
    writeSpend(context, event, p, "Executed");
  }

  for (const [i, participant] of p.participants.entries()) {
    const m = await member(context, p.groupId, participant);
    context.Member.set(withUsed(m, m.used + (p.shares[i] ?? 0n)));
  }
  await addToPool(context, p.groupId, -p.amount);
  activity(context, event, p.groupId, "SpendExecuted", p.spender, {
    counterparty: p.to,
    amount: p.amount,
    spendId: p.spendId,
  });
});

indexer.onEvent({ contract: "GroupVault", event: "SpendRejected" }, async ({ event, context }) => {
  const p = event.params;
  const spend = await context.Spend.getOrThrow(spendKey(p.groupId, p.spendId));
  context.Spend.set({ ...spend, status: "Rejected" });
  activity(context, event, p.groupId, "SpendRejected", p.by, { spendId: p.spendId, amount: spend.amount });
});

indexer.onEvent({ contract: "GroupVault", event: "ShareDisputed" }, async ({ event, context }) => {
  const p = event.params;
  const spend = await context.Spend.getOrThrow(spendKey(p.groupId, p.spendId));
  const share = await context.SpendShare.getOrThrow(shareId(p.groupId, p.spendId, p.participant));
  context.SpendShare.set({ ...share, disputed: true });

  const participant = await member(context, p.groupId, p.participant);
  context.Member.set(withUsed(participant, participant.used - p.share));
  const spender = await member(context, p.groupId, spend.spender);
  context.Member.set(withUsed(spender, spender.used + p.share));

  activity(context, event, p.groupId, "ShareDisputed", p.participant, {
    counterparty: spend.spender,
    amount: p.share,
    spendId: p.spendId,
  });
});

indexer.onEvent({ contract: "GroupVault", event: "ReceiptAttached" }, async ({ event, context }) => {
  const p = event.params;
  const id = spendKey(p.groupId, p.spendId);
  const spend = await context.Spend.getOrThrow(id);
  context.Spend.set({ ...spend, receiptCount: spend.receiptCount + 1 });
  context.Receipt.set({
    id: eventId(event),
    spend_id: id,
    by: lower(p.by),
    receiptHash: p.receiptHash,
    timestamp: BigInt(event.block.timestamp),
  });
  activity(context, event, p.groupId, "ReceiptAttached", p.by, { spendId: p.spendId });
});

indexer.onEvent({ contract: "GroupVault", event: "Settled" }, async ({ event, context }) => {
  const p = event.params;
  const group = await context.Group.getOrThrow(p.groupId.toString());
  context.Group.set({
    ...group,
    status: "Settled",
    settledAt: BigInt(event.block.timestamp),
    settleTxHash: event.transaction.hash,
  });
  // actor = siapa yang memanggil settle (penjadwal backend atau anggota).
  activity(context, event, p.groupId, "Settled", event.transaction.from ?? "", { amount: p.poolBefore });
});

indexer.onEvent({ contract: "GroupVault", event: "Pulled" }, async ({ event, context }) => {
  const p = event.params;
  const m = await member(context, p.groupId, p.member);
  context.Member.set({ ...m, pulled: m.pulled + p.amount, debt: p.remainingDebt });
  await addToPool(context, p.groupId, p.amount);
  activity(context, event, p.groupId, "Pulled", p.member, { amount: p.amount });
});

indexer.onEvent({ contract: "GroupVault", event: "Refunded" }, async ({ event, context }) => {
  const p = event.params;
  const m = await member(context, p.groupId, p.member);
  context.Member.set({ ...m, refunded: m.refunded + p.amount, credit: p.remainingCredit });
  await addToPool(context, p.groupId, -p.amount);
  activity(context, event, p.groupId, "Refunded", p.member, { amount: p.amount });
});

indexer.onEvent({ contract: "GroupVault", event: "DebtPaid" }, async ({ event, context }) => {
  const p = event.params;
  const m = await member(context, p.groupId, p.member);
  context.Member.set({ ...m, debt: m.debt - p.amount });
  await addToPool(context, p.groupId, p.amount);
  activity(context, event, p.groupId, "DebtPaid", p.member, { amount: p.amount });
});

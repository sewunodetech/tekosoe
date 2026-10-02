import { palette } from '@/constants/theme';
import { api, isNotFound, type ApiInvoice, type ApiProfile, type ApiSpendMeta } from '@/lib/api';
import { countryName } from '@/lib/countries';
import {
  fetchBalanceActivity,
  fetchGroup,
  fetchMyGroups,
  type EnvioActivity,
  type EnvioBalanceActivity,
  type EnvioGroup,
  type EnvioSpend,
} from '@/lib/envio';
import { money } from '@/lib/money';
import type { LocalAccount } from 'viem';

import type { ActivityIcon, FeedItem, Invoice, Member, Profile, Settlement, Spend, Trip } from '../types';

/**
 * Adapter data LIVE: uang dari Envio, label dari api (profil, judul pemakaian, invoice).
 * Menghasilkan tipe domain yang sama dengan adapter demo, jadi layar tidak berubah.
 * Kalau api tidak bisa dihubungi: nama → alamat singkat, judul → "Payment" (AGENTS.md).
 */

const TINTS = [palette.apricot, palette.greenSoft, palette.sky, palette.violetSoft, palette.butter, palette.peachSoft];
const big = (value: string | null | undefined) => BigInt(value ?? '0');
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const lower = (address: string) => address.toLowerCase();

function tintFor(address: string): string {
  let hash = 0;
  for (const char of lower(address)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length]!;
}

const monthDay = (seconds: string | number | bigint) =>
  new Date(Number(seconds) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const when = (seconds: string | number | bigint) =>
  new Date(Number(seconds) * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/**
 * Profil = label saja, jadi tidak perlu ikut polling uang (4–5 s). Cache per alamat selama 60 s,
 * satu permintaan untuk semua alamat yang kedaluwarsa, dan kalau api menolak (mis. 429) nilai
 * terakhir tetap dipakai — nama tidak mendadak jadi alamat singkat.
 */
const PROFILE_TTL_MS = 60_000;
const profileCache = new Map<string, { profile: ApiProfile | null; at: number }>();

async function profilesFor(addresses: string[]): Promise<Map<string, ApiProfile>> {
  const wanted = [...new Set(addresses.map(lower))];
  const now = Date.now();
  const stale = wanted.filter((address) => {
    const cached = profileCache.get(address);
    return !cached || now - cached.at > PROFILE_TTL_MS;
  });
  // api menerima maks. 20 alamat per permintaan.
  for (let i = 0; i < stale.length; i += 20) {
    const batch = stale.slice(i, i + 20);
    try {
      const found = new Map((await api.profiles(batch)).map((p) => [lower(p.address), p]));
      for (const address of batch) profileCache.set(address, { profile: found.get(address) ?? null, at: now });
    } catch {
      break;
    }
  }
  const result = new Map<string, ApiProfile>();
  for (const address of wanted) {
    const profile = profileCache.get(address)?.profile;
    if (profile) result.set(address, profile);
  }
  return result;
}

/** Setelah user mengubah profilnya sendiri: ambil ulang di permintaan berikutnya. */
export function forgetProfile(address: string) {
  profileCache.delete(lower(address));
}

function toMember(address: string, me: string, profile?: ApiProfile, avatarFallback?: string): Member {
  const name = profile?.displayName ?? short(address);
  const country = profile ? countryName(profile.countryCode) : '';
  return {
    id: lower(address),
    name,
    label: lower(address) === lower(me) ? 'You' : name,
    city: profile?.city ? `${profile.city}${country ? `, ${country}` : ''}` : country,
    country,
    tint: profile?.avatarColor ?? avatarFallback ?? tintFor(address),
  };
}

function iconFor(category: string | undefined): ActivityIcon {
  if (category === 'transport' || category === 'train') return 'train';
  if (category === 'fun' || category === 'music') return 'music';
  return 'food';
}

function forWhom(shares: { member: Member }[], total: number): string {
  if (shares.length >= total) return 'for everyone';
  const names = shares.map((s) => s.member.label);
  return `for ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}`;
}

function toSpend(s: EnvioSpend, members: Map<string, Member>, meta: Map<string, ApiSpendMeta>): Spend {
  const m = meta.get(s.spendId);
  const memberOf = (address: string) => members.get(lower(address)) ?? toMember(address, '');
  const shares = s.shares.map((share) => ({ member: memberOf(share.participant), share: share.disputed ? 0n : big(share.share) }));
  return {
    id: s.spendId,
    title: m?.title ?? 'Payment',
    icon: iconFor(m?.category),
    amount: big(s.amount),
    paidBy: memberOf(s.spender),
    forWhom: forWhom(shares, members.size),
    shares,
    when: when(s.executedAt ?? s.requestedAt),
    hasReceipt: s.receiptCount > 0,
    receipts: (s.receipts ?? []).map((r) => ({ hash: r.receiptHash as `0x${string}`, by: memberOf(r.by), at: Number(r.timestamp) })),
    status: s.status === 'Pending' ? 'pending' : s.status === 'Rejected' ? 'rejected' : 'executed',
  };
}

function statusLine(g: EnvioGroup): string {
  if (g.status === 'Settled') return 'Settled';
  const days = Math.ceil((Number(g.endsAt) * 1000 - Date.now()) / 86_400_000);
  if (days > 1) return `${days} days left`;
  if (days === 1) return '1 day left';
  return 'Settling now';
}

function countriesLine(members: Member[]): string {
  const unique = [...new Set(members.map((m) => m.country).filter(Boolean))];
  if (unique.length <= 3) return unique.join(' · ');
  return `${unique.slice(0, 2).join(' · ')} · +${unique.length - 2} more`;
}

async function buildTrip(g: EnvioGroup, me: string, account?: LocalAccount): Promise<Trip> {
  const [byAddress, meta] = await Promise.all([
    profilesFor(g.members.map((m) => m.address)),
    account ? safe(api.spendMeta(account, g.id), [] as ApiSpendMeta[]) : Promise.resolve([] as ApiSpendMeta[]),
  ]);
  const members = new Map(g.members.map((m) => [lower(m.address), toMember(m.address, me, byAddress.get(lower(m.address)))]));
  const metaById = new Map(meta.map((row) => [row.spendId, row]));
  const mine = g.members.find((m) => lower(m.address) === lower(me));

  return {
    id: g.id,
    name: g.name,
    pot: big(g.pool),
    myBalance: big(mine?.net),
    members: [...members.values()],
    countries: countriesLine([...members.values()]),
    status: statusLine(g),
    settlesOn: monthDay(g.endsAt),
    approvalLimit: big(g.approvalThreshold),
    activity: g.spends.filter((s) => s.status !== 'Rejected').map((s) => toSpend(s, members, metaById)),
    settleToday:
      g.status === 'Settled' ? [] : g.members.map((m) => ({ member: members.get(lower(m.address))!, amount: big(m.net) })),
    settled: g.status === 'Settled',
  };
}

// ---------------------------------------------------------------- queries

export async function liveTrips(me: string, account?: LocalAccount) {
  const groups = await fetchMyGroups(me);
  // Satu permintaan profil untuk semua trip; buildTrip lalu membaca dari cache.
  await profilesFor(groups.flatMap((g) => g.members.map((m) => m.address)));
  const trips = await Promise.all(groups.map((g) => buildTrip(g, me, account)));
  const settledTrips = trips.filter((t) => t.settled);
  
  return {
    list: trips.filter((t) => !t.settled),
    settled: settledTrips.map((t) => ({ id: t.id, name: t.name, returnAmount: money(t.myBalance > 0n ? t.myBalance : 0n) })),
    totalGotBack: money(settledTrips.reduce((acc, t) => acc + (t.myBalance > 0n ? t.myBalance : 0n), 0n)),
  };
}

export async function liveTrip(id: string, me: string, account?: LocalAccount): Promise<Trip> {
  const group = await fetchGroup(id);
  if (!group) throw new Error('This trip could not be found');
  return buildTrip(group, me, account);
}

export async function liveSpend(tripId: string, spendId: string, me: string, account?: LocalAccount): Promise<Spend> {
  const trip = await liveTrip(tripId, me, account);
  const spend = trip.activity.find((s) => s.id === spendId);
  if (spend) return spend;
  // Rejected spends are not in the activity list.
  const group = await fetchGroup(tripId);
  const raw = group?.spends.find((s) => s.spendId === spendId);
  if (!raw) throw new Error('This payment could not be found');
  return toSpend(raw, new Map(trip.members.map((m) => [m.id, m])), new Map());
}

export async function liveSettlement(tripId: string, me: string): Promise<Settlement> {
  const group = await fetchGroup(tripId);
  if (!group) throw new Error('This trip could not be found');
  const byAddress = await profilesFor(group.members.map((m) => m.address));
  return {
    tripId,
    date: monthDay(group.settledAt ?? group.endsAt),
    rows: group.members.map((m) => ({
      member: toMember(m.address, me, byAddress.get(lower(m.address))),
      put: big(m.deposited),
      used: big(m.used),
      net: big(m.net),
    })),
  };
}

type InvoicePayload = { pulled: string; refunded: string; remainingDebt: string; remainingCredit: string };

export async function liveInvoice(tripId: string, account: LocalAccount): Promise<Invoice> {
  const me = account.address;
  const [group, apiInvoice] = await Promise.all([fetchGroup(tripId), api.myInvoice(account, tripId)]);
  if (!group) throw new Error('This trip could not be found');
  const trip = await buildTrip(group, me, account);
  return buildInvoice(trip, group, apiInvoice, me);
}

function buildInvoice(trip: Trip, group: EnvioGroup, invoice: ApiInvoice, me: string): Invoice {
  const payload = JSON.parse(invoice.payload) as InvoicePayload;
  const pulled = big(payload.pulled);
  const refunded = big(payload.refunded);
  const shortAtSettle = pulled + big(payload.remainingDebt);
  const position = group.members.find((m) => lower(m.address) === lower(me));
  const owner = trip.members.find((m) => m.label === 'You') ?? toMember(me, me);
  const stillToPay = big(position?.debt);

  const lines: Invoice['lines'] = [];
  for (const a of [...group.activities].reverse()) {
    if (a.type === 'Deposited' && lower(a.actor) === lower(me)) {
      lines.push({ date: monthDay(a.timestamp), title: 'You put in', sub: 'Deposit', amount: big(a.amount), positive: true });
    }
  }
  for (const spend of [...trip.activity].reverse()) {
    const share = spend.shares.find((s) => s.member.id === lower(me))?.share ?? 0n;
    if (spend.status === 'executed' && share > 0n) {
      lines.push({ date: spend.when.split(',')[0]!, title: spend.title, sub: `Your share of ${money(spend.amount)}`, amount: -share });
    }
  }
  const settledOn = monthDay(group.settledAt ?? group.endsAt);
  if (refunded > 0n) lines.push({ date: settledOn, title: 'Refund at settle-up', sub: 'Sent to your balance', amount: -refunded });
  if (pulled > 0n) {
    lines.push({ date: settledOn, title: 'Safety net collected', sub: `Up to the ${money(big(position?.pullCap))} you allowed`, amount: pulled, positive: true });
  }

  const status = stillToPay === 0n && invoice.status === 'due' ? 'paid' : invoice.status;
  if (status === 'refunded') {
    return {
      number: invoice.number,
      status,
      owner,
      headline: `+${money(refunded)}`,
      headlineColor: 'positive',
      subline: `${trip.name} · ${owner.name}${owner.city ? `, ${owner.city}` : ''}`,
      lines,
      totals: [
        { label: 'Put in', value: big(position?.deposited) },
        { label: 'Your shares', value: big(position?.used) },
        { label: 'Refunded to you', value: refunded },
        { label: 'Left in the trip', value: big(position?.credit), strong: true },
      ],
    };
  }
  return {
    number: invoice.number,
    status,
    owner,
    headline: `${money(stillToPay)} to pay`,
    headlineColor: 'text',
    subline:
      shortAtSettle === 0n
        ? `${trip.name} · nothing was short at settle-up.`
        : `Your safety net covered ${money(pulled)} of the ${money(shortAtSettle)} you were short.`,
    lines,
    totals: [
      { label: 'Short at settle-up', value: shortAtSettle },
      { label: 'Covered by safety net', value: pulled },
      { label: 'Still to pay', value: stillToPay, strong: true },
    ],
  };
}

// ---------------------------------------------------------------- activity feed

/** Satu event GroupVault (Envio `Activity`) → baris Activity dari sudut pandang `me`, atau null kalau tidak relevan. */
function toFeedItem(a: EnvioActivity, group: EnvioGroup, trip: Trip, me: string): FeedItem | null {
  const isMe = lower(a.actor) === lower(me);
  const actor = isMe ? undefined : trip.members.find((m) => m.id === lower(a.actor));
  const who = actor?.name ?? 'A friend';
  const amount = big(a.amount);
  const base = { id: a.id, at: Number(a.timestamp), actor };
  const rawSpend = a.spendId ? group.spends.find((s) => s.spendId === a.spendId) : undefined;
  const spend = a.spendId ? trip.activity.find((s) => s.id === a.spendId) : undefined;
  const spendTitle = spend?.title ?? 'Payment';
  const spendHref = `/trip/${trip.id}/spend/${a.spendId}`;

  switch (a.type) {
    case 'GroupCreated':
      return { ...base, kind: 'tripStarted', title: isMe ? 'You started a trip' : `${who} started a trip`, sub: trip.name, href: `/trip/${trip.id}` };
    case 'MemberJoined':
      return {
        ...base,
        kind: 'joined',
        title: isMe ? `You joined ${trip.name}` : `${who} joined`,
        sub: isMe ? `Safety net up to ${money(amount)}` : trip.name,
        href: `/trip/${trip.id}`,
      };
    case 'Deposited':
      return isMe
        ? { ...base, kind: 'deposit', title: 'You filled the pot', sub: trip.name, amount: -amount, href: `/trip/${trip.id}` }
        : { ...base, kind: 'deposit', title: `${who} put in`, sub: trip.name, neutralAmount: amount, href: `/trip/${trip.id}` };
    case 'SpendRequested':
      // Sudah dibayar / ditolak: baris SpendExecuted / SpendRejected yang bercerita.
      if (rawSpend?.status !== 'Pending') return null;
      return isMe
        ? { ...base, kind: 'spendRequested', title: 'You asked to pay', sub: `${spendTitle} · waiting for a yes`, neutralAmount: amount, href: `${spendHref}/waiting` }
        : { ...base, kind: 'spendRequested', title: `${who} wants to pay`, sub: `${spendTitle} · ${trip.name}`, neutralAmount: amount, needsYou: true, href: `${spendHref}/approve` };
    case 'SpendExecuted': {
      const myShare = spend?.shares.find((s) => s.member.id === lower(me))?.share ?? 0n;
      const paid = isMe ? 'You paid' : `${who} paid`;
      return {
        ...base,
        kind: 'spend',
        title: spendTitle,
        sub: myShare > 0n && !isMe ? `${paid} · your share ${money(myShare)}` : `${paid} · ${trip.name}`,
        neutralAmount: amount,
        href: spendHref,
      };
    }
    case 'SpendRejected':
      return {
        ...base,
        kind: 'declined',
        title: isMe ? 'You declined a request' : 'Request declined',
        sub: `${spendTitle} · ${isMe ? trip.name : `by ${who}`}`,
        neutralAmount: amount || undefined,
        href: `${spendHref}/declined`,
      };
    case 'ShareDisputed':
      return { ...base, kind: 'disputed', title: isMe ? 'You disputed your share' : `${who} disputed a share`, sub: spendTitle, neutralAmount: amount, href: spendHref };
    case 'ReceiptAttached':
      return { ...base, kind: 'receipt', title: 'Receipt added', sub: `${spendTitle} · by ${isMe ? 'you' : who}`, href: `${spendHref}/receipt` };
    case 'Settled':
      return { ...base, actor: undefined, kind: 'settled', title: `${trip.name} settled up`, sub: 'See how it evened out', href: `/trip/${trip.id}/settled` };
    // Uang keluar/masuk dolar kamu sendiri; milik orang lain tidak ditampilkan.
    case 'Pulled':
      return isMe ? { ...base, kind: 'safetyNet', title: 'Safety net used', sub: trip.name, amount: -amount, href: `/trip/${trip.id}/invoice` } : null;
    case 'Refunded':
      return isMe ? { ...base, kind: 'refund', title: 'You got money back', sub: trip.name, amount, href: `/trip/${trip.id}/invoice` } : null;
    case 'DebtPaid':
      return isMe ? { ...base, kind: 'debtPaid', title: 'You paid your bill', sub: trip.name, amount: -amount, href: `/trip/${trip.id}/invoice` } : null;
    default:
      return null;
  }
}

function toBalanceItem(b: EnvioBalanceActivity): FeedItem {
  const amount = big(b.amount);
  return b.kind === 'TopUp'
    ? { id: b.id, kind: 'topUp', title: 'Top up', sub: 'Added to your dollars', amount, at: Number(b.timestamp) }
    : { id: b.id, kind: 'cashOut', title: 'Cash out', sub: 'Sent to your bank (demo)', amount: -amount, at: Number(b.timestamp) };
}

/**
 * Layar Activity: event semua trip user + Top up / Cash out, terbaru dulu.
 * Kalau indexer belum punya `BalanceActivity` (belum di-redeploy), baris saldo dilewati saja.
 */
export async function liveFeed(me: string, account?: LocalAccount): Promise<FeedItem[]> {
  const [groups, balance] = await Promise.all([fetchMyGroups(me), safe(fetchBalanceActivity(me), [] as EnvioBalanceActivity[])]);
  await profilesFor(groups.flatMap((g) => g.members.map((m) => m.address)));
  const trips = await Promise.all(groups.map((g) => buildTrip(g, me, account)));

  const items = balance.map(toBalanceItem);
  groups.forEach((group, i) => {
    for (const a of group.activities) {
      const item = toFeedItem(a, group, trips[i]!, me);
      if (item) items.push(item);
    }
  });
  return items.sort((x, y) => y.at - x.at);
}

// ---------------------------------------------------------------- profile

export async function liveProfile(account: LocalAccount): Promise<Profile | null> {
  try {
    const p = await api.myProfile(account);
    return {
      name: p.displayName,
      city: p.city ?? '',
      country: countryName(p.countryCode),
      tint: p.avatarColor ?? tintFor(account.address),
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

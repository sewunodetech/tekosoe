import { formatDollars, parseDollars } from '@tekosoe/shared';

import { palette } from '@/constants/theme';

/**
 * Data demo dari cerita di canvas "Final UI": tiga teman (Indonesia, Singapura, Australia) di Jepang.
 * Semua layar membaca dari sini supaya ceritanya konsisten.
 * TODO: ganti dengan data Envio (angka) + apps/api (nama, judul, struk) — lihat apps/mobile/AGENTS.md.
 */

/** Dolar → bigint AUSD (6 desimal). */
export const usd = (dollars: number | string) => parseDollars(String(dollars));

/** "$150.00" */
export const money = (amount: bigint) => formatDollars(amount);

/** "+$70.00" / "−$10.00" */
export const signed = (amount: bigint) => (amount > 0n ? `+${formatDollars(amount)}` : formatDollars(amount));

export type Member = {
  id: string;
  name: string;
  /** Nama yang ditampilkan dari sudut pandang user ("You"). */
  label: string;
  city: string;
  country: string;
  tint: string;
};

export const members = {
  rina: { id: 'rina', name: 'Rina', label: 'Rina', city: 'Jakarta, Indonesia', country: 'Indonesia', tint: palette.apricot },
  wei: { id: 'wei', name: 'Wei', label: 'Wei', city: 'Singapore', country: 'Singapore', tint: palette.greenSoft },
  jack: { id: 'jack', name: 'Jack', label: 'You', city: 'Sydney, Australia', country: 'Australia', tint: palette.sky },
  dewi: { id: 'dewi', name: 'Dewi', label: 'Dewi', city: 'Bandung, Indonesia', country: 'Indonesia', tint: palette.violetSoft },
  mei: { id: 'mei', name: 'Mei', label: 'Mei', city: 'Osaka, Japan', country: 'Japan', tint: palette.butter },
  lukas: { id: 'lukas', name: 'Lukas', label: 'Lukas', city: 'Berlin, Germany', country: 'Germany', tint: palette.peachSoft },
} satisfies Record<string, Member>;

export const me = members.jack;

export type ActivityIcon = 'food' | 'music' | 'train';

export type Spend = {
  id: string;
  title: string;
  icon: ActivityIcon;
  amount: bigint;
  paidBy: Member;
  forWhom: string;
  shares: { member: Member; share: bigint }[];
  when: string;
  hasReceipt: boolean;
};

const japanMembers = [members.rina, members.wei, members.jack];

export const spends: Record<string, Spend> = {
  dinner: {
    id: 'dinner',
    title: 'Dinner in Shibuya',
    icon: 'food',
    amount: usd(90),
    paidBy: members.rina,
    forWhom: 'for everyone',
    shares: japanMembers.map((member) => ({ member, share: usd(30) })),
    when: 'Oct 9, 8:42 PM',
    hasReceipt: true,
  },
  ramen: {
    id: 'ramen',
    title: 'Ramen and karaoke',
    icon: 'music',
    amount: usd(60),
    paidBy: members.wei,
    forWhom: 'for Rina and Wei',
    shares: [
      { member: members.rina, share: usd(30) },
      { member: members.wei, share: usd(30) },
    ],
    when: 'Oct 10, 9:15 PM',
    hasReceipt: false,
  },
  train: {
    id: 'train',
    title: 'Train tickets to Kyoto',
    icon: 'train',
    amount: usd(150),
    paidBy: members.jack,
    forWhom: 'for everyone',
    shares: japanMembers.map((member) => ({ member, share: usd(50) })),
    when: 'Oct 11, 9:12 AM',
    hasReceipt: true,
  },
};

export type Trip = {
  id: string;
  name: string;
  pot: bigint;
  myBalance: bigint;
  members: Member[];
  /** Kalimat negara di kartu trip. */
  countries: string;
  status: string;
  settlesOn: string;
  approvalLimit: bigint;
  activity: Spend[];
  /** Perkiraan "If we settled today". */
  settleToday: { member: Member; amount: bigint }[];
};

export const trips: Record<string, Trip> = {
  japan: {
    id: 'japan',
    name: 'Japan Trip',
    pot: usd(150),
    myBalance: usd(70),
    members: japanMembers,
    countries: 'Indonesia · Singapore · Australia',
    status: '6 days left',
    settlesOn: 'Oct 14',
    approvalLimit: usd(100),
    activity: [spends.ramen, spends.dinner],
    settleToday: [
      { member: members.rina, amount: usd(40) },
      { member: members.wei, amount: usd(40) },
      { member: members.jack, amount: usd(70) },
    ],
  },
  euro: {
    id: 'euro',
    name: 'Euro Summer',
    pot: usd(1240),
    myBalance: usd(200),
    members: [members.rina, members.dewi, members.wei, members.jack, members.mei, members.lukas],
    countries: 'Indonesia · Singapore · +3 more',
    status: 'Starts in 12 days',
    settlesOn: 'Aug 30',
    approvalLimit: usd(200),
    activity: [],
    settleToday: [],
  },
};

export const getTrip = (id?: string) => trips[id ?? ''] ?? trips.japan;
export const getSpend = (id?: string) => spends[id ?? ''] ?? spends.dinner;

/** Ringkasan per anggota setelah settle (F13). */
export const settlement = {
  tripId: 'japan',
  date: 'Oct 14',
  rows: [
    { member: members.rina, put: usd(100), used: usd(110), net: -usd(10) },
    { member: members.wei, put: usd(100), used: usd(110), net: -usd(10) },
    { member: members.jack, put: usd(100), used: usd(80), net: usd(20) },
  ],
};

export type InvoiceStatus = 'refunded' | 'due' | 'paid';

export type Invoice = {
  number: string;
  status: InvoiceStatus;
  owner: Member;
  /** Label HP di header ("Wei's phone") untuk demo multi-perangkat. */
  device?: string;
  headline: string;
  headlineColor: 'positive' | 'text';
  subline: string;
  lines: { date: string; title: string; sub: string; amount: bigint; positive?: boolean }[];
  totals: { label: string; value: bigint; strong?: boolean }[];
};

const commonLines = {
  deposit: { date: 'Oct 8', title: 'You put in', sub: 'Deposit', amount: usd(100), positive: true },
  dinner: { date: 'Oct 9', title: 'Dinner in Shibuya', sub: 'Your share of $90.00', amount: -usd(30) },
  ramen: { date: 'Oct 10', title: 'Ramen and karaoke', sub: 'Your share of $60.00', amount: -usd(30) },
  train: { date: 'Oct 11', title: 'Train tickets to Kyoto', sub: 'Your share of $150.00', amount: -usd(50) },
};

/** I1 (Jack, refunded), I2 (Wei, due), I3 (Rina, paid). */
export const invoices: Record<string, Invoice> = {
  jack: {
    number: 'INV-JPN-0003',
    status: 'refunded',
    owner: members.jack,
    headline: '+$20.00',
    headlineColor: 'positive',
    subline: 'Japan Trip · Oct 8–14, 2026 · Jack, Sydney',
    lines: [
      commonLines.deposit,
      commonLines.dinner,
      commonLines.train,
      { date: 'Oct 14', title: 'Refund at settle-up', sub: 'Sent to your balance', amount: -usd(20) },
    ],
    totals: [
      { label: 'Put in', value: usd(100) },
      { label: 'Your shares', value: usd(80) },
      { label: 'Refunded to you', value: usd(20) },
      { label: 'Left in the trip', value: 0n, strong: true },
    ],
  },
  wei: {
    number: 'INV-JPN-0002',
    status: 'due',
    owner: members.wei,
    device: "Wei's phone",
    headline: '$5.00 to pay',
    headlineColor: 'text',
    subline: 'Your safety net covered $5 of the $10 you were short.',
    lines: [
      commonLines.deposit,
      commonLines.dinner,
      commonLines.ramen,
      commonLines.train,
      { date: 'Oct 14', title: 'Safety net collected', sub: 'Up to the $5 you allowed', amount: usd(5), positive: true },
    ],
    totals: [
      { label: 'Short at settle-up', value: usd(10) },
      { label: 'Covered by safety net', value: usd(5) },
      { label: 'Still to pay', value: usd(5), strong: true },
    ],
  },
  rina: {
    number: 'INV-JPN-0001',
    status: 'paid',
    owner: members.rina,
    device: "Rina's phone",
    headline: '$0.00 to pay',
    headlineColor: 'text',
    subline: 'Your safety net covered the $10 you were short.',
    lines: [
      commonLines.deposit,
      commonLines.dinner,
      commonLines.ramen,
      commonLines.train,
      { date: 'Oct 14', title: 'Safety net collected', sub: 'From the $50 you allowed', amount: usd(10), positive: true },
    ],
    totals: [
      { label: 'Short at settle-up', value: usd(10) },
      { label: 'Covered by safety net', value: usd(10) },
      { label: 'Still to pay', value: 0n, strong: true },
    ],
  },
};

export const getInvoice = (who?: string) => invoices[who ?? ''] ?? invoices.jack;

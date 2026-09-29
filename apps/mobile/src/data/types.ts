export type Member = {
  id: string;
  name: string;
  /** Nama yang ditampilkan dari sudut pandang user ("You"). */
  label: string;
  city: string;
  country: string;
  tint: string;
};

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

/** Ringkasan per anggota setelah settle (F13). */
export type Settlement = {
  tripId: string;
  date: string;
  rows: { member: Member; put: bigint; used: bigint; net: bigint }[];
};

/** Profil user sendiri (P1/P2). Live: api → `profiles`. */
export type Profile = {
  name: string;
  city: string;
  country: string;
  tint: string;
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

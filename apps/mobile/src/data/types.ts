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

export type SpendReceipt = {
  /** keccak256(ciphertext), dicatat lewat `attachReceipt`. */
  hash: `0x${string}`;
  by: Member;
  /** Detik Unix. */
  at: number;
};

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
  /** Live: struk yang dilampirkan (sidik jari on-chain), terbaru dulu. Demo: tidak diisi. */
  receipts?: SpendReceipt[];
  /** Live: status on-chain. Demo: tidak diisi (dianggap sudah dibayar). */
  status?: 'pending' | 'executed' | 'rejected';
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
  /** Live: sudah di-settle on-chain. */
  settled?: boolean;
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

/** Jenis baris di layar Activity (riwayat lintas trip + saldo dolar). */
export type FeedKind =
  | 'topUp'
  | 'cashOut'
  | 'tripStarted'
  | 'joined'
  | 'deposit'
  | 'spendRequested'
  | 'spend'
  | 'declined'
  | 'disputed'
  | 'receipt'
  | 'settled'
  | 'safetyNet'
  | 'refund'
  | 'debtPaid';

/**
 * Satu baris di layar Activity. Live: event GroupVault + Transfer AUSD (Top up / Cash out) dari Envio,
 * label dari api. `amount` bertanda dari sudut pandang user: + masuk ke dolar kamu, − keluar.
 */
export type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  sub: string;
  /** Nominal bertanda (+ / −). `undefined` = tanpa nominal. */
  amount?: bigint;
  /** Nominal tanpa tanda untuk kejadian orang lain ("Rina paid $90"). */
  neutralAmount?: bigint;
  /** Detik Unix, untuk urutan dan pengelompokan per hari. */
  at: number;
  /** Orang yang melakukan, kalau bukan kamu (avatar). */
  actor?: Member;
  /** Permintaan yang menunggu persetujuanmu — tampil di "Needs you". */
  needsYou?: boolean;
  /** Tujuan saat baris diketuk. */
  href?: string;
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
  /** Kode akses berbagi dari api (berlaku 7 hari); ikut di QR/link supaya invoice bisa diperiksa tanpa login. */
  shareToken?: string;
};

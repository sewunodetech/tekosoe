import type { AvatarTint } from "@/components/ui/avatar";

/**
 * Tipe domain untuk dashboard web. Bentuknya sama dengan apps/mobile/src/data/types.ts,
 * kecuali `tint` yang di web berupa nama kelas Tailwind (AvatarTint), bukan hex.
 */
export type Member = {
  id: string;
  name: string;
  /** Nama yang ditampilkan dari sudut pandang user ("You"). */
  label: string;
  city: string;
  country: string;
  tint: AvatarTint;
};

export type ActivityIcon = "food" | "music" | "train";

export type Spend = {
  id: string;
  tripId: string;
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

export type SettledTrip = { name: string; returnAmount: bigint };

export type Profile = {
  name: string;
  city: string;
  country: string;
  tint: AvatarTint;
  stats: { activeTrips: number; settled: number; gotBack: bigint };
};

export type InvoiceStatus = "refunded" | "due" | "paid";

export type Invoice = {
  number: string;
  tripId: string;
  /** Kunci pemilik di demo ("jack" | "wei" | "rina") — dipakai untuk `?who=`. */
  who: string;
  status: InvoiceStatus;
  owner: Member;
  headline: string;
  headlineTone: "positive" | "text";
  subline: string;
  lines: { date: string; title: string; sub: string; amount: bigint; positive?: boolean }[];
  totals: { label: string; value: bigint; strong?: boolean }[];
};

export type CardShop = { id: string; name: string; note: string; amount: bigint; tint: "bg-sky" | "bg-apricot" };
export type TripCardInfo = {
  tripName: string;
  last4: string;
  canSpend: bigint;
  tapLimit: bigint;
  shops: CardShop[];
};

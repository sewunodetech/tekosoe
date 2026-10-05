import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { money, signed } from "@/lib/money";
import type { Member, Spend, Trip } from "@/data/types";
import { Sparkle, PulseDot } from "./decor";
import { Icon, type IconName } from "./icons";
import { Teko } from "./Teko";
import { Avatar } from "./ui/avatar";
import { AvatarStack, Pill } from "./ui/layout";

/** Baris aktivitas di layar Trip: ikon, judul, siapa/untuk siapa, nominal, tanda struk. */
export function ActivityRow({ spend, href, fresh = false, meta }: { spend: Spend; href?: string; fresh?: boolean; meta?: string }) {
  const body = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tile bg-cream">
        <Icon name={spend.icon} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold">{spend.title}</span>
        <span className="flex items-center gap-[5px] text-xs text-slate">
          {fresh && <PulseDot />}
          {meta ?? `${spend.paidBy.name} · ${spend.forWhom}`}
        </span>
      </span>
      <span className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-extrabold">{money(spend.amount)}</span>
        {spend.hasReceipt ? (
          <span className="flex items-center gap-[5px] text-[11px] font-bold text-teal">
            <Icon name="receipt" size={12} strokeWidth={2.4} />
            Receipt
          </span>
        ) : (
          <span className="text-[11px] font-bold text-brown">No receipt</span>
        )}
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-row bg-white px-3.5 py-3";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-sand")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Baris anggota + nominal ("If we settled today", split, settle-up). */
export function MemberAmountRow({
  member,
  amount,
  sub,
  size = 26,
  positive,
  showSign = true,
}: {
  member: Member;
  amount: bigint;
  sub?: string;
  size?: number;
  positive?: boolean;
  showSign?: boolean;
}) {
  const isPositive = positive ?? amount > 0n;
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={member.name} tint={member.tint} size={size} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", sub ? "font-bold" : "font-normal")}>{member.label}</p>
        {sub ? <p className="text-xs text-slate">{sub}</p> : null}
      </div>
      <span className={cn("text-sm font-extrabold", isPositive && showSign ? "text-green" : "text-ink")}>
        {showSign ? signed(amount) : money(amount)}
      </span>
    </div>
  );
}

/** Baris orang dengan kota (Invite, Trip members). */
export function PersonRow({ member, badge }: { member: Member; badge?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar name={member.name} tint={member.tint} size={38} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold">{member.label}</p>
        <p className="type-caption text-slate">{member.city}</p>
      </div>
      {badge ? <span className="text-xs font-bold text-teal">{badge}</span> : null}
    </div>
  );
}

/** Kartu trip di Home — selang-seling mint dan violet. */
export function TripCard({ trip, tone }: { trip: Trip; tone: "mint" | "violet" }) {
  const mint = tone === "mint";
  const big = trip.members.length > 3;
  const sub = mint ? "text-teal-muted" : "text-violet-ink";
  const ring = mint ? "border-mint" : "border-violet";

  // Kartu bisa diketuk (tautan penuh di belakang), baris anggota di atasnya — hindari <a> bersarang.
  return (
    <article className={cn("relative flex flex-col gap-3.5 overflow-hidden rounded-trip p-5", mint ? "bg-mint" : "bg-violet")}>
      <Link href={`/trips/${trip.id}`} aria-label={`Open ${trip.name}`} className="absolute inset-0 z-0" />
      <span className={cn("pointer-events-none absolute -top-[30px] -right-[30px] h-[120px] w-[120px] rounded-full", mint ? "bg-mint-deep" : "bg-violet-deep")} />
      {mint && <Sparkle size={20} className="top-[22px] right-7" />}
      <div className="pointer-events-none relative flex items-center gap-2.5">
        <h3 className="type-h3">{trip.name}</h3>
        <Pill label={trip.status} tone={mint ? "bg-peach text-ink" : "bg-white text-ink"} />
      </div>
      <div className="pointer-events-none relative flex gap-3">
        <div className="flex-1">
          <p className={cn("type-caption", sub)}>In the pot</p>
          <p className="type-h1">{money(trip.pot)}</p>
        </div>
        <div className="flex-1">
          <p className={cn("type-caption", sub)}>Your balance</p>
          <p className="type-h1 text-green">{signed(trip.myBalance)}</p>
        </div>
      </div>
      {big ? (
        <Link href={`/trips/${trip.id}/members`} aria-label={`See all ${trip.members.length} members`} className="relative z-10 flex items-center gap-2">
          <AvatarStack people={trip.members.slice(0, 3)} ring={ring} extra={trip.members.length - 3} />
          <span className={cn("type-caption flex-1 font-semibold", sub)}>{trip.countries}</span>
          <Icon name="chevron" size={16} className={sub} />
        </Link>
      ) : (
        <div className="pointer-events-none relative flex items-center gap-2">
          <AvatarStack people={trip.members} ring={ring} />
          <span className={cn("type-caption font-semibold", sub)}>{trip.countries}</span>
        </div>
      )}
    </article>
  );
}

/** Kartu pot di layar Trip: jumlah di pot + Teko + saldo user. */
export function PotCard({ pot, settles, balance }: { pot: string; settles: string; balance: string }) {
  return (
    <section className="relative flex flex-col gap-1.5 overflow-hidden rounded-hero bg-mint p-5" aria-label="Pot">
      <span className="pointer-events-none absolute -right-10 -bottom-[50px] h-[170px] w-[170px] rounded-full bg-mint-deep" />
      <Teko mood="idle" size={104} className="absolute right-1.5 -bottom-2.5" />
      <Sparkle size={18} className="top-5 right-[116px]" />
      <p className="relative text-[13px] font-bold text-teal-muted">In the pot</p>
      <p className="type-amount-xl relative">{pot}</p>
      <p className="type-caption relative text-teal-muted">{settles}</p>
      <p className="relative mt-2 self-start rounded-full bg-white px-3 py-[7px] text-[13px] font-bold">
        Your balance <span className="text-green">{balance}</span>
      </p>
    </section>
  );
}

/** S1: pot kosong — Teko tertidur. */
export function EmptyPot() {
  return (
    <section className="flex flex-col items-center gap-1.5 rounded-hero bg-mist p-5" aria-label="Pot">
      <Teko mood="sleep" size={150} />
      <p className="text-[13px] font-bold text-mist-ink">In the pot</p>
      <p className="type-amount-xl">$0.00</p>
      <p className="max-w-[280px] text-center text-sm leading-[21px] text-mist-ink">
        The pot is empty, so Teko is napping. Payments and the card pause until someone adds money.
      </p>
    </section>
  );
}

/** Kelas tile aksi 74px di layar Trip; dipakai untuk tautan biasa maupun pemicu bottom sheet. */
export function tileClass(primary = false) {
  return cn(
    "flex h-[74px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[20px] text-[13px] transition-colors",
    primary ? "bg-teal font-extrabold text-white hover:bg-teal-deep" : "bg-white font-bold text-ink hover:bg-sand",
  );
}

export function ActionTileContent({ label, icon, primary = false }: { label: string; icon: IconName; primary?: boolean }): ReactNode {
  return (
    <>
      <Icon name={icon} size={22} strokeWidth={2.4} className={primary ? "text-white" : "text-teal"} />
      {label}
    </>
  );
}

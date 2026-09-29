import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Avatar, type AvatarTint } from "./avatar";

type ScreenProps = {
  children: ReactNode;
  /** Aksi yang menempel di bawah layar (setelah spacer `flex-grow` di desain). */
  footer?: ReactNode;
  /** Latar di belakang konten (mis. confetti). */
  background?: ReactNode;
  /** Layar tab: padding bawah lebih kecil (tab bar sudah menempel di bawah). */
  tab?: boolean;
  gap?: string;
  className?: string;
};

/** Kerangka layar: padding 20, area aman, footer di bawah — setara `Screen` di app. */
export function Screen({ children, footer, background, tab = false, gap = "gap-4", className }: ScreenProps) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {background}
      <main
        className={cn(
          "relative flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+16px)]",
          tab ? "pb-6" : "pb-[calc(env(safe-area-inset-bottom)+28px)]",
          className,
        )}
      >
        <div className={cn("flex flex-col", gap)}>{children}</div>
        <div className={footer ? "min-h-4 grow" : "grow"} />
        {footer ? <div className="flex flex-col gap-2">{footer}</div> : null}
      </main>
    </div>
  );
}

/** Kartu putih (atau berwarna) dengan sudut 22. `tone` = kelas latar. */
export function Surface({
  children,
  tone = "bg-white",
  padded = true,
  className,
}: {
  children: ReactNode;
  tone?: string;
  padded?: boolean;
  className?: string;
}) {
  return <div className={cn("overflow-hidden rounded-card", tone, padded && "px-[18px] py-4", className)}>{children}</div>;
}

/** Label kecil berbentuk pil ("6 days left", "Simulated", status invoice). */
export function Pill({
  label,
  tone = "bg-white text-ink",
  weight = "extrabold",
  className,
}: {
  label: string;
  /** Kelas latar + warna teks. */
  tone?: string;
  weight?: "bold" | "extrabold";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block self-start rounded-full px-3 py-[5px] text-xs",
        weight === "bold" ? "font-bold" : "font-extrabold",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Baris label — nilai ("Your share … $50.00"). */
export function KeyValue({
  label,
  value,
  valueTone = "text-ink",
  strong = false,
}: {
  label: string;
  value: ReactNode;
  valueTone?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className={strong ? "font-extrabold text-ink" : "text-slate"}>{label}</span>
      <span className={cn("font-extrabold", valueTone)}>{value}</span>
    </div>
  );
}

/** Kotak info mint ("One yes from Rina or Wei is enough…"). */
export function InfoBox({ children, icon, tone = "bg-mint" }: { children: ReactNode; icon?: ReactNode; tone?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-row px-4 py-3.5", tone)}>
      {icon}
      <p className="flex-1 text-[13px] leading-[19px] font-semibold text-teal-ink">{children}</p>
    </div>
  );
}

/** Judul bagian kecil ("Activity", "If we settled today"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="px-1 text-sm font-extrabold">{children}</h2>;
}

/** Tumpukan avatar yang saling menimpa. `ring` = kelas `border-*` sewarna kartu. */
export function AvatarStack({
  people,
  size = 28,
  ring = "border-mint",
  extra,
}: {
  people: { name: string; tint: AvatarTint }[];
  size?: number;
  ring?: string;
  extra?: number;
}) {
  return (
    <div className="flex">
      {people.map((p, i) => (
        <Avatar key={p.name + i} name={p.name} size={size} tint={p.tint} ring={ring} className={i === 0 ? "" : "-ml-2"} />
      ))}
      {extra ? (
        <span
          className={cn("-ml-2 inline-flex items-center justify-center rounded-full border-2 bg-white text-[11px] font-extrabold text-slate", ring)}
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

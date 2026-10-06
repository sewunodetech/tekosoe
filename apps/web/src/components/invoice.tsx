import { cn } from "@/lib/cn";
import { money, signed } from "@/lib/money";
import type { Invoice, InvoiceStatus } from "@/data/types";
import type { VerifySummary } from "@/data/live/verify";
import { KeyValue, Pill, Surface } from "./ui/layout";

const BADGE: Record<InvoiceStatus, { label: string; tone: string }> = {
  refunded: { label: "Refunded", tone: "bg-green-soft text-green-deep" },
  due: { label: "Due", tone: "bg-peach-soft text-rust" },
  paid: { label: "Paid", tone: "bg-sky text-navy" },
};

/** Ringkasan invoice: nomor, status, angka utama. */
export function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  const badge = BADGE[invoice.status];
  return (
    <Surface className="flex flex-col gap-2 rounded-[24px]! px-5! py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.5px] text-slate">{invoice.number}</span>
        <Pill label={badge.label} tone={badge.tone} />
      </div>
      <p className={cn("type-h1 text-[32px]! leading-[34px]! tracking-[-1px]!", invoice.headlineTone === "positive" ? "text-green" : "text-ink")}>
        {invoice.headline}
      </p>
      <p className="type-caption text-slate">{invoice.subline}</p>
    </Surface>
  );
}

/** Baris rincian + total. */
export function InvoiceLines({ invoice }: { invoice: Invoice }) {
  return (
    <Surface className="py-0!">
      {invoice.lines.map((line) => (
        <div key={line.date + line.title} className="flex items-center gap-3 border-b border-sand py-[9px]">
          <span className="w-11 text-xs font-bold text-slate">{line.date}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{line.title}</p>
            <p className="text-xs text-slate">{line.sub}</p>
          </div>
          <span className={cn("text-sm font-extrabold", line.positive ? "text-green" : "text-ink")}>
            {line.positive ? signed(line.amount) : money(line.amount)}
          </span>
        </div>
      ))}
      <div className="flex flex-col gap-[5px] py-2.5">
        {invoice.totals.map((t) => (
          <KeyValue key={t.label} label={t.label} value={money(t.value)} strong={t.strong} />
        ))}
      </div>
    </Surface>
  );
}

/** Kartu "Scan to verify". */
export function VerifyCard({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <Surface className="flex items-center gap-3.5 rounded-row! px-3.5! py-3!">
      {children}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-extrabold">Scan to verify</p>
        <p className="text-xs leading-[17px] font-normal text-slate">
          Rebuilds this invoice from the trip record and checks it was not changed.
        </p>
        <p className="text-xs font-bold break-all text-teal">{label}</p>
      </div>
    </Surface>
  );
}


/** Ringkasan invoice live di /v: semua angka dibangun ulang dari catatan trip, bukan dari invoice yang dibagikan. */
export function LiveInvoiceSummary({ summary }: { summary: VerifySummary }) {
  const badge = BADGE[summary.status];
  const headline =
    summary.remainingDebt > 0n
      ? { label: "Still to pay", value: money(summary.remainingDebt), tone: "text-ink" }
      : summary.refunded > 0n
        ? { label: "Refunded at settle-up", value: signed(summary.refunded), tone: "text-green" }
        : { label: "All square", value: money(0n), tone: "text-ink" };
  return (
    <Surface className="flex flex-col gap-2 rounded-[24px]! px-5! py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.5px] text-slate">{summary.number}</span>
        <Pill label={badge.label} tone={badge.tone} />
      </div>
      <p className={cn("type-h1 text-[32px]! leading-[34px]! tracking-[-1px]!", headline.tone)}>{headline.value}</p>
      <p className="type-caption text-slate">{headline.label}</p>
      <div className="mt-1 flex flex-col gap-[5px] border-t border-sand pt-2.5">
        <KeyValue label="Collected at settle-up" value={money(summary.pulled)} />
        <KeyValue label="Refunded at settle-up" value={money(summary.refunded)} />
        <KeyValue label="Still to pay" value={money(summary.remainingDebt)} />
        <KeyValue label="Left in the trip" value={money(summary.remainingCredit)} />
      </div>
    </Surface>
  );
}

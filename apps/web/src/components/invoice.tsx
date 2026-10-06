import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { money, signed } from "@/lib/money";
import { SITE_DOMAIN } from "@/lib/links";
import type { Invoice, InvoiceStatus } from "@/data/types";
import { KeyValue, Pill, Surface } from "./ui/layout";

const BADGE: Record<InvoiceStatus, { label: string; tone: string }> = {
  refunded: { label: "Refunded", tone: "bg-green-soft text-green-deep" },
  due: { label: "Due", tone: "bg-peach-soft text-rust" },
  paid: { label: "Paid", tone: "bg-sky text-navy" },
};

export const verifyPath = (number: string) => `${SITE_DOMAIN}/v/${number}`;

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

/** QR asli yang membuka halaman verifikasi `https://tekosue.xyz/v/<nomor>`. */
export async function InvoiceQr({ number, size = 84 }: { number: string; size?: number }) {
  const svg = await QRCode.toString(`https://${verifyPath(number)}`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1d2426", light: "#0000" },
  });
  return (
    <span
      role="img"
      aria-label={`QR code that opens ${verifyPath(number)}`}
      className="block shrink-0 rounded-tile bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Kartu "Scan to verify". */
export function VerifyCard({ invoice, children }: { invoice: Invoice; children?: React.ReactNode }) {
  return (
    <Surface className="flex items-center gap-3.5 rounded-row! px-3.5! py-3!">
      {children}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-extrabold">Scan to verify</p>
        <p className="text-xs leading-[17px] font-normal text-slate">
          Rebuilds this invoice from the trip record and checks it was not changed.
        </p>
        <p className="text-xs font-bold break-all text-teal">{verifyPath(invoice.number)}</p>
      </div>
    </Surface>
  );
}


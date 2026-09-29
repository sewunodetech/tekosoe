import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceLines, InvoiceQr, InvoiceSummary, VerifyCard } from "@/components/invoice";
import { Logo } from "@/components/Logo";
import { Teko } from "@/components/Teko";
import { Button } from "@/components/ui/button";
import { InfoBox, Pill, Screen } from "@/components/ui/layout";
import { DEMO_INVOICE_NUMBERS, repo } from "@/data/repo";
import { GET_APP_HREF } from "@/lib/links";

export const metadata: Metadata = { title: "Verify invoice", robots: { index: false } };
export const generateStaticParams = () => DEMO_INVOICE_NUMBERS.map((number) => ({ number }));

// Halaman tujuan QR invoice (tekosoe.xyz/v/<nomor>).
// TODO (W-3): hitung ulang invoice dari data trip (Envio) dan cocokkan dengan sidik jari invoice dari api.
// Sekarang hanya menampilkan invoice demo — jangan dipakai sebagai bukti apa pun.
export default async function VerifyPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const invoice = await repo.getInvoiceByNumber(decodeURIComponent(number));
  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#1d2426] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#dcf0ea]">
      <div className="max-w-[420px] w-full flex flex-col gap-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-1">
          <Logo size={20} />
          <span className="text-xs font-bold text-[#5f6b6d] px-3 py-1 bg-[#f1eee6] rounded-full">
            Trip invoice
          </span>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#cdeedd] border border-[#b8dfd3]">
          <div className="w-5 h-5 rounded-full bg-[#1c7a4f] text-white flex items-center justify-center font-bold text-xs">
            ✓
          </div>
          <span className="text-xs font-extrabold text-[#145c3b]">
            Checked: this invoice matches the trip&apos;s records
          </span>
        </div>

        {/* Summary Card matching S10Invoice */}
        <div className="bg-white rounded-3xl p-5 border border-[#e6e2d8] shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#5f6b6d]">
              {number}
            </span>
            <span className="px-3 py-0.5 rounded-full bg-[#cdeedd] text-[#145c3b] text-xs font-extrabold">
              Refunded
            </span>
          </div>

          <div className="font-display text-4xl font-extrabold text-[#1c7a4f] tracking-tight pt-1">
            +$20.00
          </div>
          <span className="text-xs text-[#5f6b6d]">
            Refunded to Jack at settle-up · Japan Trip
          </span>
        </div>

        {/* Lines Breakdown Surface */}
        <div className="bg-white rounded-3xl p-5 border border-[#e6e2d8] shadow-sm flex flex-col">
          {/* Line 1 */}
          <div className="flex items-center gap-3 py-3 border-b border-[#f1eee6]">
            <span className="w-12 text-xs font-bold text-[#5f6b6d]">Oct 10</span>
            <div className="flex-1 flex flex-col">
              <span className="font-bold text-sm text-[#1d2426]">Deposit to pot</span>
              <span className="text-xs text-[#5f6b6d]">Initial contribution</span>
            </div>
            <span className="font-extrabold text-sm text-[#1c7a4f]">+$100.00</span>
          </div>

          {/* Line 2 */}
          <div className="flex items-center gap-3 py-3 border-b border-[#f1eee6]">
            <span className="w-12 text-xs font-bold text-[#5f6b6d]">Oct 11</span>
            <div className="flex-1 flex flex-col">
              <span className="font-bold text-sm text-[#1d2426]">Shinkansen ticket</span>
              <span className="text-xs text-[#5f6b6d]">Tokyo → Kyoto</span>
            </div>
            <span className="font-extrabold text-sm text-[#1d2426]">-$80.00</span>
          </div>

          {/* Totals */}
          <div className="flex flex-col gap-2 pt-4">
            <div className="flex justify-between text-xs text-[#5f6b6d]">
              <span>Put in</span>
              <span className="font-bold text-[#1d2426]">$100.00</span>
            </div>
            <div className="flex justify-between text-xs text-[#5f6b6d]">
              <span>Used</span>
              <span className="font-bold text-[#1d2426]">$80.00</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-[#f1eee6]">
              <span>Balance refund</span>
              <span className="text-[#1c7a4f]">+$20.00</span>
            </div>
          </div>
        </div>

        {/* Proof Info Box */}
        <div className="bg-[#fff4ec] rounded-2xl p-4 border border-[#ffdccb] text-xs text-[#6b5e55] flex flex-col gap-1">
          <span className="font-extrabold text-[#1d2426]">Why you can trust this</span>
          <span>
            Every amount comes from the trip&apos;s own records, written the moment each payment happened. Nobody, including Tekosoe, can change it afterwards.
          </span>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link href="/" className="text-xs font-bold text-[#1f7a6e] hover:underline">
            ← Back to Tekosoe
          </Link>
        </div>
      </div>

      <InvoiceSummary invoice={invoice} />
      <InvoiceLines invoice={invoice} />
      <VerifyCard invoice={invoice}>
        <InvoiceQr number={invoice.number} />
      </VerifyCard>

      <InfoBox>
        This is a preview with demo data. Real invoices will be rebuilt from the trip record and checked against the invoice here.
      </InfoBox>
    </Screen>
  );
}

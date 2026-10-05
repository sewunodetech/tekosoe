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
    <Screen
      gap="gap-3"
      footer={<Button href={GET_APP_HREF} label="Get the app" variant="outline" />}
    >
      <div className="flex items-center justify-between">
        <Logo size={20} />
        <Pill label="Trip invoice" tone="bg-sand text-slate" />
      </div>

      <div className="flex items-center gap-3 rounded-row bg-green-soft p-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
          <Teko mood="wink" size={40} bob={false} />
        </span>
        <p className="text-xs font-extrabold text-green-deep">Checked: this invoice matches the trip&apos;s records</p>
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

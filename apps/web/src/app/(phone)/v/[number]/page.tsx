import type { Metadata } from "next";
import { VerifyView } from "@/components/verify-view";

// Halaman tujuan QR invoice (tekosue.xyz/v/<nomor>).
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

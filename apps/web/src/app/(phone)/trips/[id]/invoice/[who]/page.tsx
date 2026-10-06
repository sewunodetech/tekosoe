import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceLines, InvoiceSummary, VerifyCard } from "@/components/invoice";
import { InvoiceQr } from "@/components/invoice-qr";
import { PrintButton, ShareButton } from "@/components/invoice-actions";
import { AppAction } from "@/components/ui/app-sheet";
import { buttonClass } from "@/components/ui/button";
import { Screen } from "@/components/ui/layout";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Segmented } from "@/components/ui/segmented";
import { repo } from "@/data/repo";
import { money } from "@/lib/money";
import { verifyHref, verifyLabel } from "@/lib/verify-link";

export const metadata: Metadata = { title: "Trip invoice" };
export const dynamicParams = false;
export const generateStaticParams = () => ["jack", "wei", "rina"].map((who) => ({ id: "japan", who }));

const SWITCH: Record<string, string> = { jack: "Jack (Refund)", wei: "Wei (Due)", rina: "Rina (Paid)" };

// I1 Refunded · I2 Due · I3 Paid — apps/mobile/src/app/trip/[id]/invoice.tsx
export default async function InvoicePage({ params }: { params: Promise<{ id: string; who: string }> }) {
  const { id, who } = await params;
  const [trip, invoices] = await Promise.all([repo.getTrip(id), repo.listInvoices(id)]);
  const invoice = invoices.find((i) => i.who === who);
  if (!trip || !invoice) notFound();

  const due = invoice.totals.find((t) => t.strong)?.value ?? 0n;
  // Pratinjau demo: tanpa kode akses, jadi URL tanpa query.
  const url = verifyHref(invoice.number);

  return (
    <Screen
      gap="gap-3"
      footer={
        <div className="flex flex-col gap-2.5 print:hidden">
          {invoice.status === "due" && (
            <AppAction deepLink={`trip/${id}/invoice`} className={buttonClass("primary")} title="Pay in the app">
              <span>Pay {money(due)}</span>
            </AppAction>
          )}
          <div className="flex gap-2.5">
            <PrintButton className="flex-1" />
            <ShareButton title={`${trip.name} invoice ${invoice.number}`} url={url} className="flex-1" />
          </div>
        </div>
      }
    >
      <div className="print:hidden">
        <ScreenHeader title="Trip invoice" href={`/trips/${id}/settled`} />
      </div>
      <div className="print:hidden">
        <Segmented
          activeId={who}
          options={invoices.map((i) => ({ id: i.who, label: SWITCH[i.who] ?? i.owner.name, href: `/trips/${id}/invoice/${i.who}` }))}
        />
      </div>
      <InvoiceSummary invoice={invoice} />
      <InvoiceLines invoice={invoice} />
      <VerifyCard label={verifyLabel(invoice.number)}>
        <InvoiceQr href={url} label={verifyLabel(invoice.number)} />
      </VerifyCard>
    </Screen>
  );
}

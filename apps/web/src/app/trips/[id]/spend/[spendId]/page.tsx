import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { MemberAmountRow } from "@/components/trip";
import { AppAction } from "@/components/ui/app-sheet";
import { buttonClass } from "@/components/ui/button";
import { Screen, Surface } from "@/components/ui/layout";
import { ScreenHeader } from "@/components/ui/screen-header";
import { DEMO_SPEND_PARAMS, repo } from "@/data/repo";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Payment details" };
export const dynamicParams = false;
export const generateStaticParams = () => DEMO_SPEND_PARAMS;

// 11 Payment details — apps/mobile/src/app/trip/[id]/spend/[spendId]/index.tsx
export default async function PaymentDetailsPage({ params }: { params: Promise<{ id: string; spendId: string }> }) {
  const { id, spendId } = await params;
  const spend = await repo.getSpend(id, spendId);
  if (!spend) notFound();
  const myShare = spend.shares.find((s) => s.member.label === "You")?.share ?? 0n;

  return (
    <Screen
      footer={
        <>
          <AppAction deepLink={`trip/${id}/spend/${spend.id}`} className={buttonClass("outline")} title="Do this in the app">
            <span>I wasn&apos;t part of this</span>
          </AppAction>
          <p className="type-caption text-center text-xs text-slate">
            Moves your {money(myShare)} share back to {spend.paidBy.name}. Open for 24 hours.
          </p>
        </>
      }
    >
      <ScreenHeader title="Payment details" href={`/trips/${id}`} />

      <section className="flex flex-col items-center gap-2 rounded-trip bg-cream px-5 py-[22px]">
        <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white">
          <Icon name={spend.icon} size={26} strokeWidth={2} />
        </span>
        <p className="type-amount-xl">{money(spend.amount)}</p>
        <p className="type-body-strong">{spend.title}</p>
        <p className="type-caption text-cocoa">
          Paid by {spend.paidBy.name} · {spend.when}
        </p>
      </section>

      <Surface className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold">Split equally, {spend.forWhom}</h2>
        {spend.shares.map(({ member, share }) => (
          <MemberAmountRow key={member.id} member={member} amount={share} size={28} showSign={false} />
        ))}
      </Surface>

      <Surface className="flex items-center gap-3 px-4! py-3.5!">
        <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-sand">
          <Icon name="lock" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">Receipt</p>
          <p className="text-xs text-slate">{spend.hasReceipt ? "Encrypted · only the group can open it" : "No receipt added yet"}</p>
        </div>
        {spend.hasReceipt && (
          <AppAction deepLink={`trip/${id}/spend/${spend.id}/receipt`} className="text-sm font-extrabold text-teal" title="Open receipts in the app" message="Receipts are encrypted on the group's phones. Unlock them with your passkey in the app.">
            Open
          </AppAction>
        )}
      </Surface>

      <p className="type-caption flex items-center gap-2 text-slate">
        <span className="h-2 w-2 rounded-full bg-green" />
        Recorded on Monad
      </p>
    </Screen>
  );
}

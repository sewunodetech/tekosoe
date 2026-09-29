import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Confetti, Pop } from "@/components/decor";
import { Icon } from "@/components/icons";
import { Teko } from "@/components/Teko";
import { MemberAmountRow } from "@/components/trip";
import { Button } from "@/components/ui/button";
import { InfoBox, Pill, Screen, Surface } from "@/components/ui/layout";
import { DEMO_TRIP_IDS, repo } from "@/data/repo";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Settled" };
export const dynamicParams = false;
// Hanya trip yang punya ringkasan settle di data demo.
export const generateStaticParams = () => DEMO_TRIP_IDS.filter((id) => id === "japan").map((id) => ({ id }));

// 13 Settled — apps/mobile/src/app/trip/[id]/settled.tsx
export default async function SettledPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, settlement] = await Promise.all([repo.getTrip(id), repo.getSettlement(id)]);
  if (!trip || !settlement) notFound();

  const mine = settlement.rows.find((r) => r.member.label === "You");
  const short = settlement.rows.filter((r) => r.net < 0n).map((r) => r.member.name);
  const short$ = (n: bigint) => money(n).replace(".00", "");

  return (
    <Screen
      background={<Confetti />}
      footer={
        <>
          <Button href={`/trips/${trip.id}/invoice`} label="See your invoice" />
          <Button href="/trips" label="Back to your trips" variant="ghost" />
        </>
      }
    >
      <div className="flex flex-col items-center gap-2.5 pt-3">
        <Pop>
          <Teko mood="cheer" size={150} />
        </Pop>
        <Pill label={`${trip.name} · settled ${settlement.date}`} tone="bg-green-soft text-green-deep" />
        <h1 className="type-hero text-center text-[34px]!">You got {money(mine?.net ?? 0n)} back</h1>
        <p className="text-[15px] text-slate">Already in your balance. Nothing to chase.</p>
      </div>

      <Surface className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold">How it evened out</h2>
        {settlement.rows.map((row) => (
          <MemberAmountRow
            key={row.member.id}
            member={row.member}
            amount={row.net}
            size={30}
            sub={`Put in ${short$(row.put)} · used ${short$(row.used)}`}
          />
        ))}
      </Surface>

      <InfoBox
        icon={
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green">
            <Icon name="check" size={18} strokeWidth={2.6} />
          </span>
        }
      >
        {short.join("’s and ")}’s $10 came from their safety nets. Nothing left to pay.
      </InfoBox>

      <div className="flex gap-2">
        <Button href={`/trips/${trip.id}/invoice/wei`} label="Demo: Wei’s invoice" variant="dashed" className="min-h-11 flex-1 rounded-input!" />
        <Button href={`/trips/${trip.id}/invoice/rina`} label="Demo: Rina’s invoice" variant="dashed" className="min-h-11 flex-1 rounded-input!" />
      </div>
    </Screen>
  );
}

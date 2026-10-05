import type { Metadata } from "next";
import { Bob, Sparkle } from "@/components/decor";
import { Logo } from "@/components/Logo";
import { Teko } from "@/components/Teko";
import { PersonRow } from "@/components/trip";
import { Button } from "@/components/ui/button";
import { Screen, Surface } from "@/components/ui/layout";
import { DEMO_TRIP_IDS, repo } from "@/data/repo";
import { GET_APP_HREF, appLink } from "@/lib/links";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "You're invited", robots: { index: false } };
export const generateStaticParams = () => DEMO_TRIP_IDS.map((code) => ({ code }));

// 05 Invite, versi web — apps/mobile/src/app/invite/[code]/index.tsx.
// Tugas halaman ini: membuka app lewat deep link, dengan fallback ke halaman unduh.
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const trip = await repo.getTrip(code);
  const organizer = trip?.members[0];
  const others = trip?.members.filter((m) => m.label !== "You") ?? [];

  return (
    <Screen
      gap="gap-5"
      footer={
        <>
          <Button href={appLink(`invite/${encodeURIComponent(code)}`)} label="Open in Tekosoe" />
          <Button href={GET_APP_HREF} label="Get the app" variant="outline" />
          <p className="type-caption text-center text-slate">New here? Your account is created as you join.</p>
        </>
      }
    >
      <section className="relative h-[260px] overflow-hidden rounded-invite bg-mint">
        <div className="absolute top-5 left-5">
          <Logo size={20} dot={false} />
        </div>
        <Bob className="absolute top-14 left-1/2 -translate-x-1/2">
          <Teko mood="love" size={160} bob={false} />
        </Bob>
        <Sparkle size={22} className="top-[90px] left-[70px]" />
        <Sparkle size={16} color="var(--color-coin)" className="top-[60px] right-[70px]" delay={800} />
      </section>

      {trip && organizer ? (
        <>
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] font-semibold text-slate">{organizer.name} invited you to</p>
            <h1 className="type-hero">{trip.name}</h1>
          </div>

          <Surface className="py-1.5!">
            {others.map((m) => (
              <PersonRow key={m.id} member={m} badge={m.id === organizer.id ? "Organizer" : undefined} />
            ))}
          </Surface>

          <div className="flex gap-2">
            <Fact label="Ends" value={trip.settlesOn} />
            <Fact label="In the pot" value={money(trip.pot)} />
            <Fact label="Approval" value={`Over ${money(trip.approvalLimit).replace(".00", "")}`} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-semibold text-slate">A friend invited you to</p>
          <h1 className="type-hero">a shared trip pot</h1>
          <p className="type-body text-slate">Open Tekosoe on your phone to see who&apos;s in and join with your passkey.</p>
        </div>
      )}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-row bg-white p-3">
      <p className="text-xs text-slate">{label}</p>
      <p className="text-sm font-extrabold">{value}</p>
    </div>
  );
}

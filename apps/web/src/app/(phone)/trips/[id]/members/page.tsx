import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MAX_GROUP_MEMBERS } from "@tekosue/shared";
import { Icon } from "@/components/icons";
import { PersonRow } from "@/components/trip";
import { AppAction } from "@/components/ui/app-sheet";
import { buttonClass } from "@/components/ui/button";
import { Pill, Screen, Surface } from "@/components/ui/layout";
import { ScreenHeader } from "@/components/ui/screen-header";
import { DEMO_TRIP_IDS, repo } from "@/data/repo";

export const metadata: Metadata = { title: "Members" };
export const dynamicParams = false;
export const generateStaticParams = () => DEMO_TRIP_IDS.map((id) => ({ id }));

// S6 Trip members — apps/mobile/src/app/trip/[id]/members.tsx
export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await repo.getTrip(id);
  if (!trip) notFound();

  const countries = new Map<string, number>();
  trip.members.forEach((m) => countries.set(m.country, (countries.get(m.country) ?? 0) + 1));
  const room = MAX_GROUP_MEMBERS - trip.members.length;

  return (
    <Screen
      footer={
        <AppAction deepLink={`invite/${trip.id}`} className={buttonClass("primary")} title="Invite friends in the app">
          <Icon name="plus" strokeWidth={2.4} />
          <span>Invite more friends</span>
        </AppAction>
      }
    >
      <ScreenHeader title={trip.name} href={`/trips/${trip.id}`} />

      <div className="flex flex-col gap-1">
        <p className="type-h1">
          {trip.members.length} people, {countries.size} countries
        </p>
        <p className="text-sm text-slate">Room for {room} more. Everyone shares one pot in digital dollars.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...countries].map(([country, count]) => (
          <Pill key={country} label={count > 1 ? `${country} ×${count}` : country} weight="bold" />
        ))}
      </div>

      <Surface className="py-1.5!">
        {trip.members.map((member, i) => (
          <PersonRow key={member.id} member={member} badge={i === 0 ? "Organizer" : undefined} />
        ))}
      </Surface>
    </Screen>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Teko } from "@/components/Teko";
import { TripCard } from "@/components/trip";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { AppAction } from "@/components/ui/app-sheet";
import { Pill, Screen } from "@/components/ui/layout";
import { repo } from "@/data/repo";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Your trips" };

// Home — apps/mobile/src/app/(tabs)/trips.tsx
export default async function TripsPage() {
  const [trips, settled, profile] = await Promise.all([repo.listTrips(), repo.listSettledTrips(), repo.getProfile()]);

  return (
    <Screen
      tab
      gap="gap-[18px]"
      footer={
        <AppAction deepLink="trip/new" className={buttonClass("primary")} title="Start a trip in the app">
          <Icon name="plus" strokeWidth={2.4} />
          <span>New trip</span>
        </AppAction>
      }
    >
      <div className="flex h-12 items-center gap-3">
        <Avatar name={profile.name} tint={profile.tint} size={42} />
        <div className="flex-1">
          <p className="type-caption text-slate">Welcome back</p>
          <p className="type-h3">Hi, {profile.name}</p>
        </div>
        <AppAction
          deepLink=""
          title="Notifications live in the app"
          message="Approvals, new payments and invoices reach you as notifications on your phone."
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white transition-colors hover:bg-sand"
        >
          <span className="sr-only">Notifications</span>
          <Icon name="bell" strokeWidth={2} />
          <span className="absolute top-2.5 right-[11px] h-2 w-2 rounded-full bg-orange" />
        </AppAction>
      </div>

      <div className="flex items-center gap-2.5">
        <h1 className="type-h2">Your trips</h1>
        <Pill label="Demo preview" tone="bg-butter text-ink" className="self-center" />
      </div>

      {trips.map((trip, i) => (
        <TripCard key={trip.id} trip={trip} tone={i % 2 === 0 ? "mint" : "violet"} />
      ))}

      {settled.map((s) => (
        <div key={s.name} className="flex items-center gap-3.5 rounded-card bg-white px-5 py-[18px]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-soft text-green">
            <Icon name="check" strokeWidth={2.6} />
          </span>
          <div className="flex-1">
            <p className="type-body-strong">{s.name}</p>
            <p className="type-caption text-slate">Settled · you got {money(s.returnAmount)} back</p>
          </div>
          <Icon name="chevron" size={18} strokeWidth={2} className="text-slate" />
        </div>
      ))}

      <div className="flex items-center gap-3 rounded-card bg-cream px-[18px] py-4">
        <Teko mood="idle" size={64} />
        <p className="flex-1 text-sm leading-5 font-semibold">
          Planning another trip? Start a pot and share the link. Friends join with passkey.
        </p>
      </div>

      <Link href="/" className="type-caption self-center text-slate underline-offset-2 hover:underline">
        About Tekosoe
      </Link>
    </Screen>
  );
}

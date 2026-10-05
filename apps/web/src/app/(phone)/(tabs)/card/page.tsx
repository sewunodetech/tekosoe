import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Teko } from "@/components/Teko";
import { AppAction } from "@/components/ui/app-sheet";
import { Pill, Screen, SectionLabel } from "@/components/ui/layout";
import { repo } from "@/data/repo";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Trip card" };

// 12 Card (simulated) — apps/mobile/src/app/(tabs)/card.tsx
export default async function CardPage() {
  const card = await repo.getTripCard();

  return (
    <Screen
      tab
      gap="gap-[18px]"
      footer={
        <p className="type-caption text-center text-xs leading-[18px] text-slate">
          The card is a demo. Each tap is a real payment from the pot to the shop.
        </p>
      }
    >
      <div className="flex h-12 items-center">
        <h1 className="type-h3 flex-1">Trip card</h1>
        <Pill label="Simulated" tone="bg-butter text-ink" className="self-center" />
      </div>

      <section aria-label="Trip card" className="relative flex h-[214px] flex-col justify-between overflow-hidden rounded-trip bg-mint-card p-5">
        <span className="pointer-events-none absolute -top-[60px] -right-[50px] h-[200px] w-[200px] rounded-full bg-mint-card-deco" />
        <span className="pointer-events-none absolute -bottom-[70px] -left-[30px] h-[150px] w-[150px] rounded-full bg-peach-soft" />
        <Teko mood="idle" size={86} className="absolute right-3.5 bottom-1.5" />
        <div className="relative flex items-center justify-between">
          <Logo size={18} dot={false} />
          <span className="h-[26px] w-9 rounded-md bg-coin" />
        </div>
        <div className="relative flex flex-col gap-1">
          <p className="text-base font-bold tracking-[3px]">•••• {card.last4}</p>
          <p className="type-caption font-semibold text-teal-muted">{card.tripName} · spends from the pot</p>
        </div>
      </section>

      <div className="flex gap-2.5">
        <Stat label="Can spend" value={money(card.canSpend)} />
        <Stat label="Tap limit" value={money(card.tapLimit)} />
      </div>

      <section className="flex flex-col gap-2">
        <SectionLabel>Tap to pay at a demo shop</SectionLabel>
        {card.shops.map((shop) => (
          <AppAction
            key={shop.id}
            deepLink="card"
            title="Tap to pay in the app"
            message="The trip card pays from the pot at a real shop. Try it on your phone."
            className="flex items-center gap-3 rounded-row bg-white px-3.5 py-3 text-left transition-colors hover:bg-sand"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-tile text-sm font-extrabold ${shop.tint}`}>
              {shop.name.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{shop.name}</span>
              <span className="block text-xs text-slate">
                {shop.note} · {money(shop.amount)}
              </span>
            </span>
            <Icon name="chevron" size={18} strokeWidth={2} className="text-slate" />
          </AppAction>
        ))}
      </section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-row bg-white p-3.5">
      <p className="text-xs text-slate">{label}</p>
      <p className="font-display text-[22px] leading-7 font-bold">{value}</p>
    </div>
  );
}

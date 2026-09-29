import Link from "next/link";
import { ActionTileContent, ActivityRow, EmptyPot, MemberAmountRow, PotCard, tileClass } from "@/components/trip";
import { AppAction } from "@/components/ui/app-sheet";
import { Button, buttonClass } from "@/components/ui/button";
import { AvatarStack, Screen, SectionLabel, Surface } from "@/components/ui/layout";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { Spend, Trip } from "@/data/types";
import { money, signed, usd } from "@/lib/money";

/** Layar Trip (F07). `empty` = varian S1 "pot kosong". Hanya-baca: aksi uang membuka sheet "buka di app". */
export function TripView({ trip, lastSpend, empty = false }: { trip: Trip; lastSpend?: Spend; empty?: boolean }) {
  const deepLink = `trip/${trip.id}`;
  return (
    <Screen
      footer={
        empty ? (
          <>
            <AppAction deepLink={`${deepLink}/add-money`} className={buttonClass("primary")}>
              <span>Add money to the pot</span>
            </AppAction>
            <Button href={`/trips/${trip.id}/settled`} label="Preview settle-up" variant="outline" />
          </>
        ) : undefined
      }
    >
      <ScreenHeader
        title={trip.name}
        href="/trips"
        right={
          <Link href={`/trips/${trip.id}/members`} aria-label="Trip members">
            <AvatarStack people={trip.members.slice(0, 3)} size={30} ring="border-ivory" />
          </Link>
        }
      />

      {empty ? (
        <EmptyPot />
      ) : (
        <PotCard pot={money(trip.pot)} settles={`Settles ${trip.settlesOn} · ${trip.status}`} balance={signed(trip.myBalance)} />
      )}

      {empty ? (
        <>
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-row bg-white p-3.5">
              <p className="text-xs text-slate">Your balance</p>
              <p className="font-display text-[22px] leading-7 font-bold text-green">{signed(usd(20))}</p>
            </div>
            <div className="flex-1 rounded-row bg-white p-3.5">
              <p className="text-xs text-slate">Settles</p>
              <p className="font-display text-[22px] leading-7 font-bold">{trip.settlesOn}</p>
            </div>
          </div>
          {lastSpend && (
            <ActivityRow spend={lastSpend} fresh meta={`You · approved by ${trip.members[0].name} · just now`} />
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2.5">
            <AppAction deepLink={`${deepLink}/add-money`} className={tileClass()}>
              <ActionTileContent label="Add money" icon="plus" />
            </AppAction>
            <AppAction deepLink={`${deepLink}/pay`} className={tileClass(true)}>
              <ActionTileContent label="Pay" icon="pay" primary />
            </AppAction>
            <Link href="/card" className={tileClass()}>
              <ActionTileContent label="Card" icon="card" />
            </Link>
          </div>

          {trip.settleToday.length > 0 && (
            <Surface className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold">If we settled today</h2>
                <Link href={`/trips/${trip.id}/settled`} className="text-[13px] font-extrabold text-teal">
                  Preview settle-up →
                </Link>
              </div>
              {trip.settleToday.map((row) => (
                <MemberAmountRow key={row.member.id} member={row.member} amount={row.amount} />
              ))}
            </Surface>
          )}

          <section className="flex flex-col gap-1">
            <div className="pb-1.5">
              <SectionLabel>Activity</SectionLabel>
            </div>
            {trip.activity.length === 0 ? (
              <p className="type-caption px-1 text-slate">Nothing yet. Payments show up here as friends spend from the pot.</p>
            ) : (
              trip.activity.map((spend, i) => (
                <ActivityRow
                  key={spend.id}
                  spend={spend}
                  fresh={i === 0}
                  meta={i === 0 ? `${spend.paidBy.name} · ${spend.forWhom} · settled instantly` : undefined}
                  href={spend.hasReceipt ? `/trips/${trip.id}/spend/${spend.id}` : undefined}
                />
              ))
            )}
          </section>

          {trip.id === "japan" && (
            <Button href={`/trips/${trip.id}/empty`} label="Demo: see the empty pot" variant="dashed" className="min-h-11 text-[13px]" />
          )}
        </>
      )}
    </Screen>
  );
}

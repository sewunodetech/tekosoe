import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sparkle } from '@/components/decor';
import { combine, QueryState } from '@/components/query-state';
import { Teko } from '@/components/teko';
import { ActivityRow, MemberAmountRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { AvatarStack, Screen, SectionLabel, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { money, signed, usd } from '@/lib/money';

// 07 Trip — canvas "Final UI" › F07Group. Dengan `?state=empty` menjadi S1 Pot is empty (S01PotEmpty),
// yang muncul setelah permintaan $150 disetujui di layar 10.
// TODO (M6): Envio (pot, saldo, feed) + api (judul, status struk). Pot kosong dari pot == 0, bukan query param.
export default function TripScreen() {
  const { id, state } = useLocalSearchParams<{ id: string; state?: string }>();
  // Pengeluaran terakhir yang disetujui (demo: tiket kereta), untuk keadaan S1.
  const query = combine(useTrip(id), useSpend('train'));
  return (
    <QueryState query={query}>
      {([trip, lastSpend]) => <TripView trip={trip} lastSpend={lastSpend} empty={state === 'empty'} />}
    </QueryState>
  );
}

function TripView({ trip, lastSpend, empty }: { trip: Trip; lastSpend: Spend; empty: boolean }) {
  return (
    <Screen
      gap={16}
      footer={
        empty ? (
          <>
            <Link href={`/trip/${trip.id}/add-money`} asChild>
              <Button label="Add money to the pot" />
            </Link>
            <Link href={`/trip/${trip.id}/settled`} asChild>
              <Button label="Preview settle-up" variant="outline" />
            </Link>
          </>
        ) : undefined
      }>
      <ScreenHeader
        title={trip.name}
        right={
          <Link href={`/trip/${trip.id}/members`} asChild>
            <Pressable accessibilityLabel="Trip members">
              <AvatarStack people={trip.members.slice(0, 3)} size={30} ring={colors.background} />
            </Pressable>
          </Link>
        }
      />

      {empty ? <EmptyPot /> : <PotCard potLabel={money(trip.pot)} settles={`Settles ${trip.settlesOn} · ${trip.status}`} balance={signed(trip.myBalance)} />}

      {empty ? (
        <>
          <View style={styles.statRow}>
            <Surface style={styles.stat} padded={false}>
              <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
                Your balance
              </Text>
              <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }} color={colors.positive}>
                {signed(usd(20))}
              </Text>
            </Surface>
            <Surface style={styles.stat} padded={false}>
              <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
                Settles
              </Text>
              <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }}>
                {trip.settlesOn}
              </Text>
            </Surface>
          </View>
          <ActivityRow spend={lastSpend} fresh meta={`You · approved by ${trip.members[0].name} · just now`} />
        </>
      ) : (
        <>
          <View style={styles.actions}>
            <ActionTile label="Add money" icon="plus" href={`/trip/${trip.id}/add-money`} />
            <ActionTile label="Pay" icon="pay" href={`/trip/${trip.id}/pay`} primary />
            <ActionTile label="Card" icon="card" href="/card" />
          </View>

          {trip.settleToday.length > 0 && (
            <Surface style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>If we settled today</Text>
                <Link href={`/trip/${trip.id}/settled`}>
                  <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13 }} color={colors.primary}>
                    Preview settle-up →
                  </Text>
                </Link>
              </View>
              {trip.settleToday.map((row) => (
                <MemberAmountRow key={row.member.id} member={row.member} amount={row.amount} />
              ))}
            </Surface>
          )}

          <View style={{ gap: 4 }}>
            <View style={{ paddingBottom: 6 }}>
              <SectionLabel>Activity</SectionLabel>
            </View>
            {trip.activity.map((spend, i) => (
              <ActivityRow
                key={spend.id}
                spend={spend}
                fresh={i === 0}
                meta={i === 0 ? `${spend.paidBy.name} · ${spend.forWhom} · settled instantly` : undefined}
                href={spend.hasReceipt ? `/trip/${trip.id}/spend/${spend.id}` : undefined}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function PotCard({ potLabel, settles, balance }: { potLabel: string; settles: string; balance: string }) {
  return (
    <View style={styles.pot}>
      <View style={styles.potDeco} />
      <View style={styles.potTeko}>
        <Teko mood="idle" size={104} />
      </View>
      <Sparkle size={18} style={{ right: 116, top: 20 }} />
      <Text variant="label" style={{ fontSize: 13 }} color={colors.heroText}>
        In the pot
      </Text>
      <Text variant="amountXL">{potLabel}</Text>
      <Text variant="caption" color={colors.heroText}>
        {settles}
      </Text>
      <View style={styles.balancePill}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13 }}>
          Your balance{' '}
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13 }} color={colors.positive}>
            {balance}
          </Text>
        </Text>
      </View>
    </View>
  );
}

function EmptyPot() {
  return (
    <View style={styles.emptyPot}>
      <Teko mood="sleep" size={150} />
      <Text variant="label" style={{ fontSize: 13 }} color={colors.sleepText}>
        In the pot
      </Text>
      <Text variant="amountXL">$0.00</Text>
      <Text variant="label" style={{ fontFamily: fonts.body, maxWidth: 280, textAlign: 'center', lineHeight: 21 }} color={colors.sleepText}>
        The pot is empty, so Teko is napping. Payments and the card pause until someone adds money.
      </Text>
    </View>
  );
}

function ActionTile({ label, icon, href, primary = false }: { label: string; icon: IconName; href: Href; primary?: boolean }) {
  return (
    <Link href={href} asChild>
      {/* <Link asChild> tidak menerima array style — ratakan dulu. */}
      <Pressable style={StyleSheet.flatten([styles.tile, primary && { backgroundColor: colors.primary }])}>
        <Icon name={icon} size={22} color={primary ? colors.textOnPrimary : colors.primary} strokeWidth={2.4} />
        <Text style={{ fontFamily: primary ? fonts.bodyExtraBold : fonts.bodyBold, fontSize: 13 }} color={primary ? colors.textOnPrimary : colors.text}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pot: {
    overflow: 'hidden',
    padding: 20,
    borderRadius: radius.hero,
    backgroundColor: colors.hero,
    gap: 6,
  },
  potDeco: {
    position: 'absolute',
    right: -40,
    bottom: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.heroDeco,
  },
  potTeko: {
    position: 'absolute',
    right: 6,
    bottom: -10,
  },
  balancePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  emptyPot: {
    padding: 20,
    borderRadius: radius.hero,
    backgroundColor: colors.sleepBg,
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    height: 74,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: radius.row,
  },
});

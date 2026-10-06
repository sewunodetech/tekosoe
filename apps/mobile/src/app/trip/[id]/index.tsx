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
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, radius } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { useReceiptKeySync } from '@/features/spends/useReceiptKeySync';
import { isLive } from '@/lib/env';
import { money, signed, usd } from '@/lib/money';
import { shareInvite } from '@/features/trips/shareInvite';
import { MAX_GROUP_MEMBERS } from '@tekosue/shared';

// 07 Trip — canvas "Final UI" › F07Group. Dengan `?state=empty` menjadi S1 Pot is empty (S01PotEmpty),
// yang muncul setelah permintaan $150 disetujui di layar 10.
// Live: Envio (pot, saldo, feed, polling) + api (judul). Pot kosong = pot 0 setelah ada pemakaian.
export default function TripScreen() {
  const { id, state } = useLocalSearchParams<{ id: string; state?: string }>();
  // Demo: pengeluaran terakhir yang disetujui (tiket kereta), untuk keadaan S1.
  const demoSpend = useSpend(isLive ? '' : 'train');
  const trip = useTrip(id);
  useReceiptKeySync([id]);
  if (isLive) {
    return (
      <QueryState query={trip}>
        {(t) => {
          const lastSpend = t.activity.find((s) => s.status !== 'pending');
          return <TripView trip={t} lastSpend={lastSpend} empty={t.pot === 0n && !t.settled && Boolean(lastSpend)} />;
        }}
      </QueryState>
    );
  }
  return (
    <QueryState query={combine(trip, demoSpend)}>
      {([t, demoLast]) => <TripView trip={t} lastSpend={demoLast} empty={state === 'empty'} />}
    </QueryState>
  );
}

function spendHref(trip: Trip, spend: Spend): Href {
  if (spend.status === 'pending') return `/trip/${trip.id}/spend/${spend.id}/waiting`;
  // Selalu bisa dibuka: tanpa struk pun, rincian menampilkan tombol "Add" untuk yang membayar.
  return `/trip/${trip.id}/spend/${spend.id}`;
}

function TripView({ trip, lastSpend, empty }: { trip: Trip; lastSpend?: Spend; empty: boolean }) {
  return (
    <Screen
      gap={16}
      footer={
        empty ? (
          <>
            <Link href={`/trip/${trip.id}/add-money`} asChild>
              <Button label="Add money to the pot" />
            </Link>
          </>
        ) : trip.settled ? (
          <Link href={`/trip/${trip.id}/settled`} asChild>
            <Button label="See how it evened out" />
          </Link>
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

      <MembersCard trip={trip} />

      {empty ? (
        <>
          <View style={styles.statRow}>
            <Surface style={styles.stat} padded={false}>
              <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
                Your balance
              </Text>
              <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }} color={colors.positive}>
                {signed(isLive ? trip.myBalance : usd(20))}
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
          {lastSpend && (
            <ActivityRow
              spend={lastSpend}
              fresh
              meta={isLive ? `${lastSpend.paidBy.label} · ${lastSpend.when}` : `You · approved by ${trip.members[0].name} · just now`}
            />
          )}
        </>
      ) : (
        <>
          {!trip.settled && (
            <>
              <View style={styles.actions}>
                <ActionTile label="Add money" icon="plus" href={`/trip/${trip.id}/add-money`} />
                <ActionTile label="Pay" icon="pay" href={`/trip/${trip.id}/pay`} primary />
                <ActionTile label="Card" icon="card" href="/card" />
              </View>

              {trip.settleToday.length > 0 && (
                <Surface style={{ gap: 10 }}>
                  {/* Layar settle-up (dan invoice) hanya untuk trip yang sudah settle; di sini cukup perkiraannya. */}
                  <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>If we settled today</Text>
                  {trip.settleToday.map((row) => (
                    <MemberAmountRow key={row.member.id} member={row.member} amount={row.amount} />
                  ))}
                </Surface>
              )}
            </>
          )}

          <View style={{ gap: 4 }}>
            <View style={{ paddingBottom: 6 }}>
              <SectionLabel>Activity</SectionLabel>
            </View>
            {trip.activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description={!trip.settled ? "Pay from the pot to start!" : undefined}
              />
            ) : (
              trip.activity.map((spend, i) => (
                <ActivityRow
                  key={spend.id}
                  spend={spend}
                  fresh={i === 0}
                  meta={
                    i === 0
                      ? `${spend.paidBy.name} · ${spend.forWhom} · ${spend.status === 'pending' ? 'waiting for a yes' : 'settled instantly'}`
                      : undefined
                  }
                  href={spendHref(trip, spend)}
                />
              ))
            )}
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

/** "Who's in": siapa saja di trip (ke layar anggota) + tombol undang selama trip belum settle dan belum penuh. */
function MembersCard({ trip }: { trip: Trip }) {
  const count = trip.members.length;
  const room = MAX_GROUP_MEMBERS - count;
  const canInvite = !trip.settled && room > 0;
  const shown = trip.members.slice(0, 4);

  const inviteButton = (
    <Pressable
      style={styles.invite}
      accessibilityRole="button"
      accessibilityLabel="Invite friends"
      onPress={isLive ? () => void shareInvite(trip) : undefined}>
      <Icon name="plus" size={16} color={colors.textOnPrimary} strokeWidth={2.6} />
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13 }} color={colors.textOnPrimary}>
        Invite
      </Text>
    </Pressable>
  );

  return (
    <Surface style={styles.members} padded={false}>
      <Link href={`/trip/${trip.id}/members`} asChild>
        <Pressable style={styles.membersMain} accessibilityRole="button" accessibilityLabel={`See who's in, ${count} ${count === 1 ? 'person' : 'people'}`}>
          <AvatarStack people={shown} size={34} ring={colors.surface} extra={count > shown.length ? count - shown.length : undefined} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>Who&apos;s in</Text>
            <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
              {count} {count === 1 ? 'person' : 'people'}
              {canInvite ? ` · room for ${room} more` : ''}
            </Text>
          </View>
          {!canInvite && <Icon name="chevron" size={18} color={colors.textMuted} />}
        </Pressable>
      </Link>
      {canInvite &&
        (isLive ? (
          inviteButton
        ) : (
          <Link href={`/invite/${trip.id}`} asChild>
            {inviteButton}
          </Link>
        ))}
    </Surface>
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
  members: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
  },
  membersMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
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

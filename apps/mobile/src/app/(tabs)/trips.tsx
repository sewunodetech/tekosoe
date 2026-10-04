import { Link, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { Sparkle } from '@/components/decor';
import { combine, QueryState } from '@/components/query-state';
import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AvatarStack, Pill, Screen } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Profile, Trip } from '@/data/types';
import { useFeed } from '@/features/activity/useFeed';
import { useReceiptKeySync } from '@/features/spends/useReceiptKeySync';
import { useProfile } from '@/features/profile/useProfile';
import { TourOverlay } from '@/features/tour/tour-overlay';
import { useTour } from '@/features/tour/use-tour';
import { useTrips } from '@/features/trips/useTrips';
import { money, signed } from '@/lib/money';

// 03 Home — canvas "Final UI" › F03Home, plus kartu grup besar dari S05BigGroup.
export default function HomeScreen() {
  const query = combine(useTrips(), useProfile());
  return (
    <QueryState query={query} tab headerAction="none">
      {([trips, profile]) => <HomeView list={trips.list} settled={trips.settled} profile={profile} />}
    </QueryState>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function HomeView({
  list,
  settled,
  profile,
}: {
  list: Trip[];
  settled: { id: string; name: string; returnAmount: string }[];
  profile: Profile | null;
}) {
  const [drafts, setDrafts] = useState<string[]>([]);
  const me = { name: profile?.name ?? 'there', tint: profile?.tint ?? palette.sky };
  // Titik di lonceng = ada permintaan bayar yang menunggu persetujuanmu.
  const needsYou = useFeed().data?.some((item) => item.needsYou) ?? false;
  // Kunci struk menyebar ke teman setiap kali app dibuka (bukan hanya saat ada yang membuka struk).
  useReceiptKeySync(list.map((trip) => trip.id));

  // Tour pertama setelah sign in: bagian yang disorot diukur lewat ref ini.
  const tour = useTour();
  const sceneRef = useRef<View>(null);
  const newTripRef = useRef<View>(null);
  const bellRef = useRef<View>(null);
  const tourTargets = useMemo(() => ({ scene: sceneRef, newTrip: newTripRef, bell: bellRef }), []);

  return (
    <Screen
      tab
      gap={18}
      background={<View ref={sceneRef} collapsable={false} pointerEvents="none" style={StyleSheet.absoluteFill} />}
      footer={
        <View ref={newTripRef} collapsable={false}>
          <Link href="/trip/new" asChild>
            <Button label="New trip" icon={<Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} />} />
          </Link>
        </View>
      }>
      {tour.show && <TourOverlay name={me.name} targets={tourTargets} onDone={tour.done} />}
      <View style={styles.greeting}>
        <Avatar name={me.name} tint={me.tint} size={42} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color={colors.textMuted}>
            {greeting()}
          </Text>
          <Text variant="h3">Hi, {me.name}</Text>
        </View>
        <Pressable
          ref={bellRef}
          accessibilityRole="button"
          accessibilityLabel="Activity"
          style={styles.circle}
          onPress={() => router.push('/activity')}>
          <Icon name="bell" strokeWidth={2} />
          {needsYou && <View style={styles.badgeDot} />}
        </Pressable>
      </View>

      <Text variant="h2">Your trips</Text>

      {list.length === 0 ? (
        <EmptyState
          mood="wink"
          title="No active trips"
          description="Start a pot and share the link. Friends join with passkey."
        />
      ) : (
        list.map((trip, idx) => (
          <TripCard key={trip.id} trip={trip} tone={idx % 2 === 0 ? 'mint' : 'violet'} />
        ))
      )}

      {settled.length > 0 && (
        <Link href="/past-trips" asChild>
          <Pressable style={styles.pastTripsRow}>
            <Icon name="archive" size={20} color={colors.textMuted} strokeWidth={2} />
            <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15 }}>Past trips</Text>
            <Icon name="chevron" size={18} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </Link>
      )}

      {list.length > 0 && (
        <View style={styles.tip}>
          <Teko mood="idle" size={64} />
          <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 }}>
            Planning another trip? Start a pot and share the link. Friends join with passkey.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function TripCard({ trip, tone }: { trip: Trip; tone: 'mint' | 'violet' }) {
  const mint = tone === 'mint';
  const bg = mint ? colors.hero : palette.violet;
  const deco = mint ? colors.heroDeco : palette.violetDeep;
  const sub = mint ? colors.heroText : palette.violetInk;
  const big = trip.members.length > 3;

  // Kartu dan baris anggota sama-sama bisa diketuk, jadi pakai router.push (bukan <Link> bersarang).
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${trip.name}`}
      onPress={() => router.push(`/trip/${trip.id}`)}
      style={[styles.tripCard, { backgroundColor: bg }]}>
      <View style={[styles.tripDeco, { backgroundColor: deco }]} />
      {mint && <Sparkle size={20} style={{ right: 28, top: 22 }} />}
      <View style={styles.tripTitleRow}>
        <Text variant="h3">{trip.name}</Text>
        <Pill label={trip.status} bg={mint ? palette.peach : colors.surface} />
      </View>
      <View style={styles.tripStats}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color={sub}>
            In the pot
          </Text>
          <Text variant="h1">{money(trip.pot)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color={sub}>
            Your balance
          </Text>
          <Text variant="h1" color={colors.positive}>
            {signed(trip.myBalance)}
          </Text>
        </View>
      </View>
      {big ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`See all ${trip.members.length} members`}
          onPress={() => router.push(`/trip/${trip.id}/members`)}
          style={styles.membersRow}>
          <AvatarStack people={trip.members.slice(0, 3)} ring={bg} extra={trip.members.length - 3} />
          <Text variant="caption" color={sub} style={{ flex: 1, fontFamily: fonts.bodySemiBold }}>
            {trip.countries}
          </Text>
          <Icon name="chevron" size={16} color={sub} />
        </Pressable>
      ) : (
        <View style={styles.membersRow}>
          <AvatarStack people={trip.members} ring={bg} />
          <Text variant="caption" color={sub} style={{ fontFamily: fonts.bodySemiBold }}>
            {trip.countries}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    right: 11,
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  tripCard: {
    overflow: 'hidden',
    padding: 20,
    borderRadius: 26,
    gap: 14,
  },
  tripDeco: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  tripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 12,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastTripsRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tip: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.card,
    backgroundColor: colors.warmBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

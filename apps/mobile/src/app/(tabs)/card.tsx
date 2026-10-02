import { Link, router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pill, Screen, SectionLabel } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useTrips } from '@/features/trips/useTrips';
import { money } from '@/lib/money';

// 12 Card (simulated) — canvas "Final UI" › F12Card.
// Tiap tap = spend nyata dari pot ke alamat toko demo (FR-16). Tokyo Taxi mendemokan S4 (offline).
export default function CardScreen() {
  return (
    <QueryState query={useTrips()} tab headerAction="none">
      {/* Kartu memakai pot trip aktif pertama. TODO: pilih trip aktif bila lebih dari satu. */}
      {({ list }) => (list[0] ? <CardView trip={list[0]} /> : <NoTripCard />)}
    </QueryState>
  );
}

// Akun baru (mode live) belum punya trip, jadi belum ada pot untuk kartu.
function NoTripCard() {
  return (
    <Screen tab footer={<Button label="Start a trip" onPress={() => router.push('/trip/new')} />}>
      <View style={styles.header}>
        <Text variant="h3" style={{ flex: 1 }}>
          Trip card
        </Text>
        <Pill label="Simulated" bg={palette.butter} />
      </View>
      <EmptyState
        mood="think"
        title="No pot to spend from yet"
        description="Start or join a trip, and its card shows up here."
      />
    </Screen>
  );
}

function CardView({ trip }: { trip: Trip }) {
  return (
    <Screen
      tab
      gap={18}
      footer={
        <Text variant="small" color={colors.textMuted} style={styles.footnote}>
          The card is a demo. Each tap is a real payment from the pot to the shop.
        </Text>
      }>
      <View style={styles.header}>
        <Text variant="h3" style={{ flex: 1 }}>
          Trip card
        </Text>
        <Pill label="Simulated" bg={palette.butter} />
      </View>

      <View style={styles.card}>
        <View style={[styles.deco, { right: -50, top: -60, width: 200, height: 200, backgroundColor: palette.mintCardDeco }]} />
        <View style={[styles.deco, { left: -30, bottom: -70, width: 150, height: 150, backgroundColor: palette.peachSoft }]} />
        <View style={styles.cardTeko}>
          <Teko mood="idle" size={86} />
        </View>
        <View style={styles.cardTop}>
          <Logo size={18} dot={false} />
          <View style={styles.chip} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 3 }}>•••• 4821</Text>
          <Text variant="caption" color={colors.heroText} style={{ fontFamily: fonts.bodySemiBold }}>
            {trip.name} · spends from the pot
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Can spend" value={money(trip.pot)} />
        <Stat label="Tap limit" value={money(trip.approvalLimit)} />
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Tap to pay at a demo shop</SectionLabel>
        <Shop initial="L" name="Konbini Shibuya" detail="Snacks and water · $12.00" tint={palette.sky} href={`/trip/${trip.id}`} />
        <Shop initial="T" name="Tokyo Taxi" detail="Ride to hotel · $24.00" tint={palette.apricot} href={`/trip/${trip.id}/payment-failed`} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
        {label}
      </Text>
      <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }}>
        {value}
      </Text>
    </View>
  );
}

function Shop({ initial, name, detail, tint, href }: { initial: string; name: string; detail: string; tint: string; href: Href }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.shop}>
        <View style={[styles.shopIcon, { backgroundColor: tint }]}>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{name}</Text>
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
            {detail}
          </Text>
        </View>
        <Icon name="chevron" size={18} color={colors.textMuted} strokeWidth={2} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    height: 214,
    borderRadius: 26,
    backgroundColor: palette.mintCard,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
  },
  deco: {
    position: 'absolute',
    borderRadius: 999,
  },
  cardTeko: {
    position: 'absolute',
    right: 14,
    bottom: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 6,
    backgroundColor: palette.coin,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
  shop: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    textAlign: 'center',
    fontFamily: fonts.body,
    lineHeight: 18,
  },
});

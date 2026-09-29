import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Bob, Sparkle } from '@/components/decor';
import { Logo } from '@/components/logo';
import { Teko } from '@/components/teko';
import { PersonRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Screen, Surface } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useTrip } from '@/features/trips/useTrip';

// 05 Invite — canvas "Final UI" › F05Invite. Dibuka dari tekosoe://invite/<code> atau tautan web.
// TODO: api → group_meta, profiles berdasarkan kode undangan.
export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <QueryState query={useTrip(code)}>{(trip) => <InviteView trip={trip} />}</QueryState>;
}

function InviteView({ trip }: { trip: Trip }) {
  // Anggota pertama = pembuat trip; yang ditampilkan hanya anggota lain (bukan "You").
  const organizer = trip.members[0];
  const others = trip.members.filter((m) => m.label !== 'You');

  return (
    <Screen
      gap={20}
      footer={
        <>
          <Link href={`/invite/${trip.id}/join`} asChild>
            <Button label="Join with Passkey" />
          </Link>
          <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            New here? Your account is created as you join.
          </Text>
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Logo size={20} dot={false} />
        </View>
        <Bob style={styles.teko}>
          <Teko mood="love" size={160} bob={false} />
        </Bob>
        <Sparkle size={22} style={{ left: 70, top: 90 }} />
        <Sparkle size={16} color={palette.coin} style={{ right: 70, top: 60 }} delay={800} />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15 }} color={colors.textMuted}>
          {organizer.name} invited you to
        </Text>
        <Text variant="hero">{trip.name}</Text>
      </View>

      <Surface style={{ paddingVertical: 6 }}>
        {others.map((m) => (
          <PersonRow key={m.id} member={m} badge={m.id === organizer.id ? 'Organizer' : undefined} />
        ))}
      </Surface>

      <View style={styles.facts}>
        <Fact label="Ends" value={trip.settlesOn} />
        <Fact label="In the pot" value="$200" />
        <Fact label="Approval" value="Over $100" />
      </View>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    borderRadius: 30,
    backgroundColor: colors.hero,
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 56,
  },
  facts: {
    flexDirection: 'row',
    gap: 8,
  },
  fact: {
    flex: 1,
    padding: 12,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
});

import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PersonRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pill, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { MAX_GROUP_MEMBERS } from '@tekosue/shared';
import { MAX_GROUP_MEMBERS } from '@tekosue/shared';

import { QueryState } from '@/components/query-state';
import { colors, fonts } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useTrip } from '@/features/trips/useTrip';
import { isLive } from '@/lib/env';
import { shareInvite } from '@/features/trips/shareInvite';

// S6 Trip members — canvas "Final UI" › S06Members
// TODO: Envio MemberJoined + api → profiles. Batas 10 anggota ada di kontrak.
export default function TripMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <QueryState query={useTrip(id)}>{(trip) => <MembersView trip={trip} />}</QueryState>;
}

function MembersView({ trip }: { trip: Trip }) {

  const countries = new Map<string, number>();
  trip.members.forEach((m) => countries.set(m.country, (countries.get(m.country) ?? 0) + 1));
  const room = MAX_GROUP_MEMBERS - trip.members.length;

  return (
    <Screen
      footer={
        isLive ? (
          <Button
            label="Invite more friends"
            icon={<Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} />}
            onPress={() => void shareInvite(trip)}
          />
        ) : (
          <Link href={`/invite/${trip.id}`} asChild>
            <Button label="Invite more friends" icon={<Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} />} />
          </Link>
        )
      }>
      <ScreenHeader title={trip.name} />

      <View style={{ gap: 4 }}>
        <Text variant="h1">
          {trip.members.length} people, {countries.size} countries
        </Text>
        <Text variant="label" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
          Room for {room} more. Everyone shares one pot in digital dollars.
        </Text>
      </View>

      <View style={styles.chips}>
        {[...countries].map(([country, count]) => (
          <Pill key={country} label={count > 1 ? `${country} ×${count}` : country} weight="bold" />
        ))}
      </View>

      <Surface style={{ paddingVertical: 6 }}>
        {trip.members.map((member, i) => (
          <PersonRow key={member.id} member={member} badge={i === 0 ? 'Organizer' : undefined} />
        ))}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

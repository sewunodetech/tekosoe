import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { QueryState } from '@/components/query-state';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, radius } from '@/constants/theme';
import { useTrips } from '@/features/trips/useTrips';

export default function PastTripsScreen() {
  const query = useTrips();
  return (
    <QueryState query={query} title="Past trips" headerAction="back">
      {(trips) => <PastTripsView settled={trips.settled} />}
    </QueryState>
  );
}

function PastTripsView({ settled }: { settled: { id: string; name: string; returnAmount: string }[] }) {
  return (
    <Screen gap={18}>
      <ScreenHeader title="Past trips" action="back" />

      {settled.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyStrong" color={colors.textMuted}>No past trips yet</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {settled.map((s) => (
            <Pressable key={s.id} style={styles.settledRow} onPress={() => router.push(`/trip/${s.id}`)}>
              <View style={styles.checkCircle}>
                <Icon name="check" color={colors.positive} strokeWidth={2.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{s.name}</Text>
                <Text variant="caption" color={colors.textMuted}>
                  Settled · you got {s.returnAmount} back
                </Text>
              </View>
              <Icon name="chevron" size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settledRow: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.positiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

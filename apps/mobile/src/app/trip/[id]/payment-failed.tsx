import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { KeyValue, Screen, Surface } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useTrip } from '@/features/trips/useTrip';
import { money } from '@/lib/money';

// S4 Offline / payment failed — canvas "Final UI" › S04Offline. Dari kartu (Tokyo Taxi).
// Transaksi tidak terkirim; tidak ada perubahan on-chain, jadi tidak ada tagihan ganda.
export default function PaymentFailedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <QueryState query={useTrip(id)} headerAction="none">
      {(trip) => <PaymentFailedView trip={trip} />}
    </QueryState>
  );
}

function PaymentFailedView({ trip }: { trip: Trip }) {

  return (
    <Screen
      gap={18}
      footer={
        <>
          <Link href={`/trip/${trip.id}`} asChild>
            <Button label="Try again" />
          </Link>
          <Link href="/card" asChild>
            <Button label="Back to the card" variant="ghost" />
          </Link>
        </>
      }>
      <View style={styles.banner} accessibilityRole="alert">
        <Icon name="offline" size={18} strokeWidth={2} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13 }}>You&apos;re offline</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.halo}>
          <Teko mood="sad" size={150} />
        </View>
        <Text variant="h1" style={styles.textCenter}>
          The taxi payment didn&apos;t go through
        </Text>
        <Text style={[styles.textCenter, { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, maxWidth: 310 }]} color={colors.textMuted}>
          Tokyo Taxi · $24.00. Nothing left the pot, so no one gets charged twice.
        </Text>
      </View>

      <Surface style={{ gap: 10 }}>
        <KeyValue label="Pot" value={`${money(trip.pot)}, unchanged`} />
        <KeyValue label="Last synced" value="1 min ago" />
      </Surface>

      <Text variant="caption" color={colors.textMuted} style={styles.textCenter}>
        Find Wi-Fi or mobile data, then try again. Teko keeps the details ready.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    backgroundColor: palette.butter,
  },
  center: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  halo: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.sadBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
});

import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { InfoBox, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { combine, QueryState } from '@/components/query-state';
import { colors, fonts } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { money } from '@/lib/money';

// S3 Request declined — canvas "Final UI" › S03Declined
// TODO: Envio SpendRejected + api → spend_reviews (catatan penolak).
export default function RequestDeclinedScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  return (
    <QueryState query={combine(useTrip(id), useSpend(spendId, id))} headerAction="close">
      {([trip, spend]) => <DeclinedView trip={trip} spend={spend} />}
    </QueryState>
  );
}

function DeclinedView({ trip, spend }: { trip: Trip; spend: Spend }) {
  // Demo: penolak = anggota terakhir selain pembayar (Wei). Live: dari spend_reviews.
  const others = trip.members.filter((m) => m.id !== spend.paidBy.id);
  const by = others[others.length - 1] ?? trip.members[0];

  return (
    <Screen
      gap={18}
      footer={
        <>
          <Link href={`/trip/${trip.id}/pay`} asChild>
            <Button label="Change the request" />
          </Link>
          <Link href={`/trip/${trip.id}`} asChild>
            <Button label="Back to the trip" variant="ghost" />
          </Link>
        </>
      }>
      <ScreenHeader action="close" />

      <View style={styles.center}>
        <View style={styles.halo}>
          <Teko mood="sad" size={150} />
        </View>
        <Text variant="h1" style={styles.textCenter}>
          {by.name} said not this one
        </Text>
        <Text style={[styles.textCenter, { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }]} color={colors.textMuted}>
          {money(spend.amount).replace('.00', '')} train tickets · nothing left the pot.
        </Text>
      </View>

      <Surface style={styles.note}>
        <Avatar name={by.name} tint={by.tint} size={36} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13 }}>{by.name}&apos;s note</Text>
          <Text variant="body" style={{ fontSize: 15, lineHeight: 22 }}>
            &quot;Let&apos;s get the JR Pass at the station instead, it covers the return too.&quot;
          </Text>
        </View>
      </Surface>

      <InfoBox>
        The pot is still {money(trip.pot)}. You can send a new request or pay a smaller amount without approval.
      </InfoBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 12,
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
  note: {
    flexDirection: 'row',
    gap: 12,
  },
});

import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Confetti, Pop } from '@/components/decor';
import { Teko } from '@/components/teko';
import { MemberAmountRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, Pill, Screen, Surface } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { combine, QueryState } from '@/components/query-state';
import { colors, fonts, radius } from '@/constants/theme';
import type { Settlement, Trip } from '@/data/types';
import { useSettlement } from '@/features/trips/useSettlement';
import { useTrip } from '@/features/trips/useTrip';
import { money } from '@/lib/money';

// 13 Settled — canvas "Final UI" › F13Settled
// TODO: settle(groupId) oleh penjadwal; angka dari Envio Settled, Pulled, Refunded.
export default function SettledScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = combine(useTrip(id), useSettlement(id));
  return (
    <QueryState query={query} headerAction="none">
      {([trip, settlement]) => <SettledView trip={trip} settlement={settlement} />}
    </QueryState>
  );
}

function SettledView({ trip, settlement }: { trip: Trip; settlement: Settlement }) {
  const mine = settlement.rows.find((r) => r.member.label === 'You');
  const short = settlement.rows.filter((r) => r.net < 0n).map((r) => r.member.name);

  return (
    <Screen
      background={<Confetti />}
      footer={
        <>
          <Link href={`/trip/${trip.id}/invoice?who=jack`} asChild>
            <Button label="See your invoice" />
          </Link>
          <Link href="/trip/new" asChild>
            <Button label="Plan another trip" variant="ghost" />
          </Link>
        </>
      }>
      <View style={styles.center}>
        <Pop>
          <Teko mood="cheer" size={150} />
        </Pop>
        <Pill label={`${trip.name} · settled ${settlement.date}`} bg={colors.positiveBg} color={colors.positiveText} />
        <Text variant="hero" style={[styles.textCenter, { fontSize: 34 }]}>
          You got {money(mine?.net ?? 0n)} back
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15 }} color={colors.textMuted}>
          Already in your balance. Nothing to chase.
        </Text>
      </View>

      <Surface style={{ gap: 12 }}>
        <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>How it evened out</Text>
        {settlement.rows.map((row) => (
          <MemberAmountRow
            key={row.member.id}
            member={row.member}
            amount={row.net}
            size={30}
            sub={`Put in ${money(row.put).replace('.00', '')} · used ${money(row.used).replace('.00', '')}`}
          />
        ))}
      </Surface>

      <InfoBox
        icon={
          <View style={styles.checkCircle}>
            <Icon name="check" size={18} color={colors.positive} strokeWidth={2.6} />
          </View>
        }>
        {short.join("'s and ")}&apos;s $10 came from their safety nets. Nothing left to pay.
      </InfoBox>

      {/* Tautan demo untuk varian invoice di HP anggota lain (I2, I3). */}
      <View style={styles.demoRow}>
        <Link href={`/trip/${trip.id}/invoice?who=wei`} asChild>
          <Button label="Demo: Wei's invoice" variant="dashed" style={styles.demo} />
        </Link>
        <Link href={`/trip/${trip.id}/invoice?who=rina`} asChild>
          <Button label="Demo: Rina's invoice" variant="dashed" style={styles.demo} />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
  },
  textCenter: {
    textAlign: 'center',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demo: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.input,
  },
});

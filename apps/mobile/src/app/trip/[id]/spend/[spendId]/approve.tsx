import { Link, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { InfoBox, KeyValue, Pill, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette } from '@/constants/theme';
import { getSpend, getTrip, members, money } from '@/lib/demo';

// 10 Approval — canvas "Final UI" › F10Approve. Di demo dibuka "di HP Rina".
// TODO: approveSpend / rejectSpend. Peringatan kalau pengeluaran besar belum punya struk (FR-20).
export default function ApprovalScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  const trip = getTrip(id);
  const spend = getSpend(spendId);
  const reviewer = members.rina;
  const share = spend.shares.find((s) => s.member.id === reviewer.id)?.share ?? 0n;
  const others = trip.members.filter((m) => m.id !== spend.paidBy.id).map((m) => m.name);

  return (
    <Screen
      gap={18}
      footer={
        <View style={styles.footer}>
          <Link href={`/trip/${trip.id}/spend/${spend.id}/declined`} asChild>
            <Button label="Decline" variant="outline" style={{ flex: 1, height: 56 }} />
          </Link>
          <Button label="Approve" style={{ flex: 1 }} onPress={() => router.replace(`/trip/${trip.id}?state=empty`)} />
        </View>
      }>
      <ScreenHeader action="close" right={<Pill label={`${reviewer.name}'s phone`} weight="bold" color={colors.textMuted} />} />

      <View style={styles.center}>
        <View style={styles.halo}>
          <Teko mood="think" size={120} />
        </View>
        <Text variant="h1" style={styles.textCenter}>
          {spend.paidBy.name} wants to pay {money(spend.amount).replace('.00', '')}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15 }} color={colors.textMuted}>
          {spend.title} · {spend.forWhom}
        </Text>
      </View>

      <Surface style={{ gap: 10 }}>
        <KeyValue label="Your share" value={money(share)} />
        <KeyValue label="Pot after" value={money(trip.pot - spend.amount)} />
        <KeyValue
          label="Receipt"
          value={
            <Link href={`/trip/${trip.id}/spend/${spend.id}/receipt`}>
              <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }} color={colors.primary}>
                View photo
              </Text>
            </Link>
          }
        />
      </Surface>

      <InfoBox>One yes from {others.join(' or ')} is enough. Nothing moves until then.</InfoBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
  },
  halo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: palette.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
});

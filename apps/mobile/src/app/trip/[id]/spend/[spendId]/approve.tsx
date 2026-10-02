import { Link, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { InfoBox, KeyValue, Pill, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { combine, QueryState } from '@/components/query-state';
import { colors, fonts, palette } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useApproveSpend } from '@/features/spends/useApproveSpend';
import { useRejectSpend } from '@/features/spends/useRejectSpend';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { money } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { useNotifications } from '@/providers/notification-provider';

// 10 Approval — canvas "Final UI" › F10Approve. Di demo dibuka "di HP Rina".
// TODO (M4): approveSpend / rejectSpend. Peringatan kalau pengeluaran besar belum punya struk (FR-20).
export default function ApprovalScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  return (
    <QueryState query={combine(useTrip(id), useSpend(spendId, id))} headerAction="close">
      {([trip, spend]) => <ApprovalView trip={trip} spend={spend} />}
    </QueryState>
  );
}

function ApprovalView({ trip, spend }: { trip: Trip; spend: Spend }) {
  const { notify } = useNotifications();
  // Demo multi-HP: layar ini dilihat anggota pertama selain pembayar. Live: user yang login.
  const reviewer = trip.members.find((m) => m.id !== spend.paidBy.id) ?? trip.members[0];
  const share = spend.shares.find((s) => s.member.id === reviewer.id)?.share ?? 0n;
  const othersArray = trip.members.filter((m) => m.id !== spend.paidBy.id).map((m) => m.name);
  const othersText = othersArray.length > 0 ? othersArray.join(' or ') : 'a friend';

  const approveSpend = useApproveSpend(trip.id, spend.id);
  const approveTx = useTx(approveSpend.mutateAsync, {
    onSuccess: () => {
      notify({
        title: 'Payment approved',
        body: `Approved $${money(spend.amount).replace('.00', '')} for ${spend.title}.`,
        data: { url: `/trip/${trip.id}` },
      });
      router.replace(`/trip/${trip.id}?state=empty`);
    },
  });

  const rejectSpend = useRejectSpend(trip.id, spend.id);
  const rejectTx = useTx(rejectSpend.mutateAsync, {
    onSuccess: () => {
      notify({
        title: 'Payment declined',
        body: `Declined ${spend.paidBy.name}'s payment request.`,
        data: { url: `/trip/${trip.id}/spend/${spend.id}/declined` },
      });
      router.replace(`/trip/${trip.id}/spend/${spend.id}/declined`);
    },
  });

  const activeStatus = approveTx.status !== 'idle' ? approveTx.status : rejectTx.status;
  const isBusy = approveTx.isProcessing || rejectTx.isProcessing;

  return (
    <>
      <Screen
        gap={18}
        footer={
          <View style={styles.footer}>
            <Button
              label="Decline"
              variant="outline"
              style={{ flex: 1, height: 56 }}
              onPress={() => rejectTx.execute()}
              disabled={isBusy}
            />
            <Button
              label="Approve"
              style={{ flex: 1 }}
              onPress={() => approveTx.execute()}
              disabled={isBusy}
            />
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

      <InfoBox>One yes from {othersText} is enough. Nothing moves until then.</InfoBox>
    </Screen>
    <TxOverlay status={activeStatus} />
  </>
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

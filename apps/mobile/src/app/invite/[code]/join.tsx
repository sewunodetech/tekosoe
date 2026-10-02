import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { KeyValue, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useTrip } from '@/features/trips/useTrip';
import { useJoinTrip } from '@/features/trips/useJoinTrip';
import { useBalance } from '@/features/wallet/useFunds';
import { tripIdFromInvite } from '@/lib/invite';
import { money, usd } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { DiscardModal } from '@/components/ui/discard-modal';
import { useNotifications } from '@/providers/notification-provider';

// 06 Join + put in — canvas "Final UI" › F06Join
// Live: satu transaksi joinGroupWithPermit (tanda tangan undangan + permit AUSD setoran + safety net).
export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <QueryState query={useTrip(tripIdFromInvite(code))}>{(trip) => <JoinView trip={trip} code={code} />}</QueryState>;
}

function JoinView({ trip, code }: { trip: Trip; code: string }) {
  // Mulai kosong: user memilih sendiri setoran dan safety net-nya.
  const [putIn, setPutIn] = useState<number | null>(null);
  const [safetyNet, setSafetyNet] = useState<number | null>(null);
  const ready = putIn !== null && safetyNet !== null;

  const isDirty = putIn !== null || safetyNet !== null;
  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty,
    fallbackRoute: '/trips',
  });

  const balance = useBalance().data;
  const short = putIn !== null && balance !== undefined && balance < usd(putIn);
  const joinTrip = useJoinTrip(code);
  const { notify } = useNotifications();
  const joinTx = useTx(joinTrip.mutateAsync, {
    onSuccess: () => {
      notify({
        title: 'Joined trip',
        body: `You joined ${trip.name} and put in $${putIn ?? 0}.`,
        data: { url: `/trip/${trip.id}` },
      });
      router.replace(`/trip/${trip.id}`);
    },
  });

  const handleJoin = () => {
    if (putIn === null || safetyNet === null) return;
    joinTx.execute({ putIn, safetyNet });
  };

  return (
    <>
      <Screen
        gap={18}
        footer={
          short ? (
            // Dolar kurang: ajak Top up dulu (ADR 0006); kembali ke sini setelahnya.
            <Button
              label={`Top up to put in $${putIn}`}
              icon={<Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} />}
              onPress={() => router.push('/balance/top-up')}
            />
          ) : (
            <Button
              label={ready ? `Join and put in $${putIn}` : putIn === null ? 'Choose how much to put in' : 'Choose your safety net'}
              onPress={handleJoin}
              disabled={!ready || joinTx.isProcessing}
            />
          )
        }>
      <ScreenHeader title={`Join ${trip.name}`} onPress={handleBack} />

      <Surface style={styles.amountCard}>
        <Text variant="label" color={colors.textMuted}>
          Put in to start
        </Text>
        <Text style={styles.bigAmount} color={putIn === null ? colors.textMuted : undefined}>${putIn ?? 0}</Text>
        <ChoiceChips options={[50, 100, 200] as const} value={putIn} onChange={setPutIn} format={(v) => `$${v}`} />
        <Text variant="caption" color={colors.textMuted}>
          You can add more any time.
        </Text>
      </Surface>

      <View style={styles.safety}>
        <View style={styles.safetyTitle}>
          <View style={styles.shield}>
            <Icon name="shield" size={18} strokeWidth={2} />
          </View>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 15 }}>Safety net</Text>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 21 }} color={palette.bark}>
          If you end up spending more than you put in, up to this much is collected automatically at settle-up. Only if
          needed.
        </Text>
        <ChoiceChips options={[25, 50, 100] as const} value={safetyNet} onChange={setSafetyNet} format={(v) => `$${v}`} tone="ink" borderless />
      </View>

      <Surface style={{ gap: 10 }}>
        <KeyValue label="Put in now" value={putIn === null ? "—" : `$${putIn}.00`} />
        <KeyValue label="Safety net up to" value={safetyNet === null ? "—" : `$${safetyNet}.00`} />
        <KeyValue label="Your dollars" value={balance === undefined ? '…' : money(balance)} />
      </Surface>
    </Screen>
    <TxOverlay status={joinTx.status} />
    <DiscardModal
      visible={showDiscardModal}
      onCancel={() => setShowDiscardModal(false)}
      onConfirm={confirmExit}
    />
  </>
);
}

const styles = StyleSheet.create({
  amountCard: {
    padding: 22,
    borderRadius: 26,
    alignItems: 'center',
    gap: 14,
  },
  bigAmount: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 58,
    letterSpacing: -1.5,
    color: colors.text,
  },
  safety: {
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: colors.warmBg,
    gap: 12,
  },
  safetyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shield: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.peachSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { Bob, Coin } from '@/components/decor';
import { QueryState } from '@/components/query-state';
import { Teko } from '@/components/teko';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { KeyValue, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useDeposit } from '@/features/trips/useDeposit';
import { useTrip } from '@/features/trips/useTrip';
import { useBalance } from '@/features/wallet/useFunds';
import { money, signed, parseAmountInput } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { DiscardModal } from '@/components/ui/discard-modal';
import { useNotifications } from '@/providers/notification-provider';

// 08 Add money — canvas "Final UI" › F08AddMoney
// Live: depositWithPermit(groupId, amount) — permit menjaga izin safety net tetap ada.
export default function AddMoneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <QueryState query={useTrip(id)} title="Add money" headerAction="close">
      {(trip) => <AddMoneyView trip={trip} />}
    </QueryState>
  );
}

const PRESETS = [
  { label: '$20', value: '20' },
  { label: '$50', value: '50' },
  { label: '$100', value: '100' },
];

function AddMoneyView({ trip }: { trip: Trip }) {
  const [text, setText] = useState('');
  const amountBigInt = parseAmountInput(text) ?? 0n;
  const valid = amountBigInt > 0n;
  const amount = Number(amountBigInt) / 1000000;

  const { notify } = useNotifications();

  const isDirty = text !== '';
  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty,
    fallbackRoute: `/trip/${trip.id}`,
  });

  const balance = useBalance().data;
  const short = balance !== undefined && balance < amountBigInt;
  const deposit = useDeposit(trip.id);
  const depositTx = useTx(deposit.mutateAsync, {
    onSuccess: () => {
      notify({
        title: 'Pot topped up',
        body: `Added ${money(amountBigInt)} to ${trip.name} pot.`,
        data: { url: `/trip/${trip.id}` },
      });
      router.replace(`/trip/${trip.id}`);
    },
  });

  const handleAddMoney = () => {
    depositTx.execute({ amount });
  };

  return (
    <>
      <Screen
        gap={18}
        footer={
          short ? (
            // Dolar kurang: ajak Top up dulu (ADR 0006), bukan gagal di tengah transaksi.
            <Button
              label={`Top up to add ${valid ? money(amountBigInt) : '$0'}`}
              icon={<Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} />}
              onPress={() => router.push('/balance/top-up')}
            />
          ) : (
            <Button label={valid ? `Add ${money(amountBigInt)} to the pot` : 'Enter an amount'} onPress={handleAddMoney} disabled={!valid || depositTx.isProcessing} />
          )
        }>
        <ScreenHeader title="Add money" action="close" onPress={handleBack} />

        <View style={styles.stage}>
          <View style={styles.halo} />
          <View style={styles.teko}>
            <Teko mood="fill" size={130} />
          </View>
          <Bob duration={3800} delay={500} style={{ position: 'absolute', left: 60, top: 40 }}>
            <Coin size={32} style={{ position: 'relative' }} />
          </Bob>
          <Bob duration={4200} delay={1000} style={{ position: 'absolute', right: 64, top: 20 }}>
            <Coin size={26} style={{ position: 'relative' }} />
          </Bob>
          <Bob style={{ position: 'absolute', right: 80, top: 130 }}>
            <Coin size={22} style={{ position: 'relative' }} />
          </Bob>
        </View>

        <AmountInput
          value={text}
          onChange={setText}
          presets={PRESETS}
          hint={`From your ${balance === undefined ? '…' : money(balance)}`}
          accessibilityLabel="Amount to add, in dollars"
        />

        {valid && (
          <Surface style={{ gap: 10 }}>
            <KeyValue label="Pot after" value={money(trip.pot + amountBigInt)} />
            <KeyValue label="Your balance in trip" value={signed(trip.myBalance + amountBigInt)} valueColor={colors.positive} />
          </Surface>
        )}

        <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
          Anything you don&apos;t use comes back to you at settle-up.
        </Text>
      </Screen>
      <TxOverlay status={depositTx.status} />
      <DiscardModal
        visible={showDiscardModal}
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={confirmExit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 200,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    top: 10,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.hero,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 20,
  },
});

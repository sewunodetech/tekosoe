import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Bob, Coin } from '@/components/decor';
import { QueryState } from '@/components/query-state';
import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { KeyValue, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useDeposit } from '@/features/trips/useDeposit';
import { useTrip } from '@/features/trips/useTrip';
import { money, signed, usd } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';

// 08 Add money — canvas "Final UI" › F08AddMoney
// TODO (M4): deposit(groupId, amount).
export default function AddMoneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <QueryState query={useTrip(id)} title="Add money" headerAction="close">
      {(trip) => <AddMoneyView trip={trip} />}
    </QueryState>
  );
}

function AddMoneyView({ trip }: { trip: Trip }) {
  const [amount, setAmount] = useState<number>(50);

  const deposit = useDeposit(trip.id);
  const depositTx = useTx(deposit.mutateAsync, {
    onSuccess: () => {
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
          <Button
            label={`Add $${amount} to the pot`}
            onPress={handleAddMoney}
            disabled={depositTx.isProcessing}
          />
        }>
        <ScreenHeader title="Add money" action="close" />

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

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={styles.amount}>${amount}</Text>
        <Text variant="label" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
          From your balance of $320.00
        </Text>
      </View>

      <ChoiceChips options={[20, 50, 100] as const} value={amount} onChange={setAmount} format={(v) => `$${v}`} center />

      <Surface style={{ gap: 10 }}>
        <KeyValue label="Pot after" value={money(trip.pot + usd(amount))} />
        <KeyValue label="Your balance in trip" value={signed(trip.myBalance + usd(amount))} valueColor={colors.positive} />
      </Surface>

      <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Anything you don&apos;t use comes back to you at settle-up.
      </Text>
    </Screen>
    <TxOverlay status={depositTx.status} />
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
  amount: {
    fontFamily: fonts.display,
    fontSize: 60,
    lineHeight: 62,
    letterSpacing: -1.5,
    color: colors.text,
  },
});

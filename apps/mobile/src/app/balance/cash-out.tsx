import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { InfoBox, KeyValue, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { useBalance, useCashOut } from '@/features/wallet/useFunds';
import { money, usd } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';

// Cash out (ADR 0006) — dibuka dari kartu "Your dollars" di Profile. Kebalikan Top up (off-ramp).
// Testnet: dolar sungguhan keluar dari saldo ke "bank" demo; tidak ada transfer bank sungguhan.
const STEPS = [
  { title: 'Dollars leave your balance', body: 'Take out what you don’t need, like what came back after a trip.' },
  { title: 'Changed to your currency', body: 'Rupiah, Singapore dollars, Australian dollars and more.' },
  { title: 'Arrives in your bank', body: 'Straight to your own account, no cash to carry around.' },
];

export default function CashOutScreen() {
  const balance = useBalance().data;
  const [amount, setAmount] = useState<number>(50);
  const cashOut = useCashOut();
  const tx = useTx(cashOut.mutateAsync, {
    onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/profile')),
  });

  const wanted = usd(amount);
  const short = balance !== undefined && balance < wanted;

  return (
    <>
      <Screen
        gap={18}
        footer={
          <View style={{ gap: 10 }}>
            {tx.error && (
              <Text variant="caption" color={colors.danger} style={styles.center} accessibilityLiveRegion="polite">
                {tx.error}
              </Text>
            )}
            <Button
              label={short ? 'Not enough dollars' : `Cash out $${amount}`}
              onPress={() => tx.execute(wanted).catch(() => undefined)}
              disabled={short || balance === undefined || tx.isProcessing}
              style={short ? { opacity: 0.5 } : undefined}
            />
          </View>
        }>
        <ScreenHeader title="Cash out" action="close" />

        <View style={styles.stage}>
          <View style={styles.halo} />
          <View style={styles.teko}>
            <Teko mood="wink" size={110} />
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={styles.amount}>${amount}</Text>
          <Text variant="label" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
            From your {balance === undefined ? '…' : money(balance)}
          </Text>
        </View>

        <ChoiceChips options={[20, 50, 100] as const} value={amount} onChange={setAmount} format={(v) => `$${v}`} center />

        <Surface style={{ gap: 10 }}>
          <KeyValue label="To" value="Your bank (demo)" />
          <KeyValue label="Left in your dollars" value={balance === undefined ? '…' : money(short ? 0n : balance - wanted)} />
        </Surface>

        <Surface style={{ gap: 16 }}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13 }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{step.title}</Text>
                <Text variant="caption" color={colors.textMuted}>
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </Surface>

        <InfoBox icon={<Icon name="shield" size={18} color={colors.infoText} strokeWidth={2} />}>
          This is a test version: the dollars really leave your balance, but no money reaches a bank. Bank payouts come
          in the full app.
        </InfoBox>
      </Screen>
      <TxOverlay status={tx.status} processingTitle="Cashing out..." processingSubtitle="Sending your dollars to the bank" />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  stage: {
    height: 150,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    top: 4,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.hero,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 14,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 58,
    letterSpacing: -1.5,
    color: colors.text,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { Bob, Coin } from '@/components/decor';
import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, KeyValue, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { TOP_UP_MAX, useBalance, useTopUp } from '@/features/wallet/useFunds';
import { money, parseAmountInput } from '@/lib/money';
import { useNotifications } from '@/providers/notification-provider';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';

// Top up (ADR 0006) — dari kartu "Your dollars" di Profile, dan dari Add money / Join saat dolar kurang.
// Aplikasi penuh: on-ramp dari bank/kartu dalam mata uang lokal. Testnet: dolar uji dari faucet AUSD, maks. 10.000.
const STEPS = [
  { title: 'Pay in your own currency', body: 'Rupiah, Singapore dollars, Australian dollars and more, from your bank or card.' },
  { title: 'It lands here as dollars', body: 'One currency for everyone, so nobody argues about exchange rates.' },
  { title: 'Put it into any trip', body: 'Add money to a pot whenever you like. What you don’t use comes back here.' },
];

const PRESETS = [
  { label: '$50', value: '50' },
  { label: '$100', value: '100' },
  { label: '$500', value: '500' },
  { label: '$1,000', value: '1000' },
];

export default function TopUpScreen() {
  const balance = useBalance().data;
  const [text, setText] = useState('');
  const amount = parseAmountInput(text) ?? 0n;
  const tooMuch = amount > TOP_UP_MAX;
  const valid = amount > 0n && !tooMuch;

  const { notify } = useNotifications();
  const topUp = useTopUp();
  const tx = useTx(topUp.mutateAsync, {
    onSuccess: () => {
      notify({
        title: 'Top up successful',
        body: `You added ${money(amount)} to your balances.`,
      });
      router.canGoBack() ? router.back() : router.replace('/profile');
    },
  });

  const hint = tooMuch
    ? `Up to ${money(TOP_UP_MAX)} per top-up in this test version`
    : `You have ${balance === undefined ? '…' : money(balance)} now`;

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
              label={valid ? `Top up ${money(amount)}` : 'Enter an amount'}
              icon={valid ? <Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} /> : undefined}
              onPress={() => valid && tx.execute(amount).catch(() => undefined)}
              disabled={!valid || tx.isProcessing}
            />
          </View>
        }>
        <ScreenHeader title="Top up" action="close" />

        <View style={styles.stage}>
          <View style={styles.halo} />
          <View style={styles.teko}>
            <Teko mood="fill" size={96} />
          </View>
          <Bob duration={3800} delay={400} style={{ position: 'absolute', left: 84, top: 26 }}>
            <Coin size={26} style={{ position: 'relative' }} />
          </Bob>
          <Bob duration={4300} delay={900} style={{ position: 'absolute', right: 88, top: 12 }}>
            <Coin size={20} style={{ position: 'relative' }} />
          </Bob>
        </View>

        <AmountInput
          value={text}
          onChange={setText}
          presets={PRESETS}
          hint={hint}
          error={tooMuch}
          accessibilityLabel="Amount to top up, in dollars"
        />

        {valid && balance !== undefined && (
          <Surface style={{ gap: 10 }}>
            <KeyValue label="You pay" value={`${money(amount)} in your own currency`} />
            <KeyValue label="Your dollars after" value={money(balance + amount)} valueColor={colors.positive} strong />
          </Surface>
        )}

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
          This is a test version: the dollars are free test dollars, up to {money(TOP_UP_MAX)} at a time. Top-ups from
          your bank come in the full app.
        </InfoBox>
      </Screen>
      <TxOverlay status={tx.status} processingTitle="Topping up..." processingSubtitle="Your dollars will show up in a moment" />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  stage: {
    height: 130,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    top: 4,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.butter,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 14,
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
    backgroundColor: palette.coin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

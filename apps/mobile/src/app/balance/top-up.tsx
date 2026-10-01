import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Bob, Coin } from '@/components/decor';
import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { TOP_UP_AMOUNT, useBalance, useTopUp } from '@/features/wallet/useFunds';
import { money } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';

// Top up (ADR 0006) — dibuka dari kartu "Your dollars" di Profile, dan dari Add money / Join saat dolar kurang.
// Aplikasi penuh: on-ramp dari bank/kartu dalam mata uang lokal. Testnet: 10.000 dolar uji dari faucet AUSD.
const STEPS = [
  { title: 'Pay in your own currency', body: 'Rupiah, Singapore dollars, Australian dollars and more, from your bank or card.' },
  { title: 'It lands here as dollars', body: 'One currency for everyone, so nobody argues about exchange rates.' },
  { title: 'Put it into any trip', body: 'Add money to a pot whenever you like. What you don’t use comes back here.' },
];

export default function TopUpScreen() {
  const balance = useBalance().data;
  const topUp = useTopUp();
  const tx = useTx(topUp.mutateAsync, {
    onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/profile')),
  });

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
              label={`Add ${money(TOP_UP_AMOUNT)} test dollars`}
              icon={<Icon name="plus" color={colors.textOnPrimary} strokeWidth={2.4} />}
              onPress={() => tx.execute(undefined).catch(() => undefined)}
              disabled={tx.isProcessing}
            />
          </View>
        }>
        <ScreenHeader title="Top up" action="close" />

        <View style={styles.stage}>
          <View style={styles.halo} />
          <View style={styles.teko}>
            <Teko mood="fill" size={120} />
          </View>
          <Bob duration={3800} delay={400} style={{ position: 'absolute', left: 64, top: 34 }}>
            <Coin size={30} style={{ position: 'relative' }} />
          </Bob>
          <Bob duration={4300} delay={900} style={{ position: 'absolute', right: 70, top: 18 }}>
            <Coin size={24} style={{ position: 'relative' }} />
          </Bob>
        </View>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text variant="h2" style={styles.center}>
            Add dollars to your balance
          </Text>
          <Text variant="label" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
            You have {balance === undefined ? '…' : money(balance)} now
          </Text>
        </View>

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
          This is a test version, so we add {money(TOP_UP_AMOUNT)} of test dollars for free. Top-ups from your bank come
          in the full app.
        </InfoBox>
      </Screen>
      <TxOverlay
        status={tx.status}
        processingTitle="Topping up..."
        processingSubtitle="Your dollars will show up in a moment"
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  stage: {
    height: 170,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    top: 6,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: palette.butter,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 16,
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

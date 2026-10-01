import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Bob, Coin } from '@/components/decor';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius, type as typeScale } from '@/constants/theme';
import { useBalance } from '@/features/wallet/useFunds';
import { isLive } from '@/lib/env';
import { money } from '@/lib/money';

/**
 * Kartu "Your dollars" di Profile (ADR 0006): saldo pribadi di luar trip, lapisan sebelum pot.
 * Alur cross-border: mata uang lokal → Top up (on-ramp) → dolar di sini → "Add money" ke pot →
 * sisa setelah settle-up kembali ke sini → Cash out (off-ramp).
 */
export function BalanceCard() {
  const balance = useBalance().data;
  const empty = balance === 0n;

  return (
    <View style={styles.card}>
      <View style={styles.deco} />
      <Bob duration={3600} style={styles.coinA}>
        <Coin size={30} style={styles.coinInner} />
      </Bob>
      <Bob duration={4400} delay={700} style={styles.coinB}>
        <Coin size={20} style={styles.coinInner} />
      </Bob>

      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Your dollars</Text>
        {isLive && <Pill label="Test dollars" bg={palette.butter} color={palette.brownDeep} weight="bold" />}
      </View>

      <View style={{ gap: 4 }}>
        <Text
          style={styles.amount}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={balance === undefined ? 'Loading your dollars' : `You have ${money(balance)}`}>
          {balance === undefined ? '$ …' : money(balance)}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {empty ? 'Top up to start chipping in on trips.' : 'Ready to put into any trip, from any country.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Top up your dollars"
          onPress={() => router.push('/balance/top-up')}
          style={({ pressed }) => [styles.action, styles.topUp, pressed && styles.topUpPressed]}>
          <Icon name="plus" size={18} color={colors.textOnPrimary} strokeWidth={2.6} />
          <Text style={styles.actionText} color={colors.textOnPrimary}>
            Top up
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cash out to your bank"
          disabled={empty}
          onPress={() => router.push('/balance/cash-out')}
          style={({ pressed }) => [styles.action, styles.cashOut, pressed && styles.cashOutPressed, empty && styles.disabled]}>
          <Icon name="external" size={18} color={colors.text} strokeWidth={2.4} />
          <Text style={styles.actionText}>Cash out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    padding: 20,
    borderRadius: 26,
    backgroundColor: colors.surface,
    gap: 16,
  },
  deco: {
    position: 'absolute',
    right: -40,
    top: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.butter,
  },
  coinA: {
    position: 'absolute',
    right: 26,
    top: 22,
  },
  coinB: {
    position: 'absolute',
    right: 68,
    top: 52,
  },
  coinInner: {
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  amount: {
    ...typeScale.amountXL,
    color: colors.text,
    // Ruang untuk koin di kanan atas.
    marginRight: 60,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    height: 50,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    ...typeScale.button,
    fontSize: 15,
  },
  topUp: {
    backgroundColor: colors.primary,
  },
  topUpPressed: {
    backgroundColor: colors.primaryPressed,
  },
  cashOut: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cashOutPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  disabled: {
    opacity: 0.45,
  },
});

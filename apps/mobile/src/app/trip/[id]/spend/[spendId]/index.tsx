import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { MemberAmountRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { getSpend, getTrip, money } from '@/lib/demo';

// 11 Payment details — canvas "Final UI" › F11Detail
// TODO: Envio SpendExecuted + api (judul, struk). "I wasn't part of this" → disputeShare(groupId, spendId).
export default function PaymentDetailsScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  const trip = getTrip(id);
  const spend = getSpend(spendId);
  const myShare = spend.shares.find((s) => s.member.label === 'You')?.share ?? 0n;

  return (
    <Screen
      footer={
        <>
          <Link href={`/trip/${trip.id}`} asChild>
            <Button label="I wasn't part of this" variant="outline" />
          </Link>
          <Text variant="small" color={colors.textMuted} style={{ textAlign: 'center', fontFamily: fonts.body }}>
            Moves your {money(myShare)} share back to {spend.paidBy.name}. Open for 24 hours.
          </Text>
        </>
      }>
      <ScreenHeader title="Payment details" />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name={spend.icon} size={26} strokeWidth={2} />
        </View>
        <Text variant="amountXL">{money(spend.amount)}</Text>
        <Text variant="bodyStrong">{spend.title}</Text>
        <Text variant="caption" color={palette.cocoa}>
          Paid by {spend.paidBy.name} · {spend.when}
        </Text>
      </View>

      <Surface style={{ gap: 12 }}>
        <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>Split equally, {spend.forWhom}</Text>
        {spend.shares.map(({ member, share }) => (
          <MemberAmountRow key={member.id} member={member} amount={share} size={28} showSign={false} />
        ))}
      </Surface>

      <Surface style={styles.receiptRow}>
        <View style={styles.lockTile}>
          <Icon name="lock" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>Receipt</Text>
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
            Encrypted · only the group can open it
          </Text>
        </View>
        <Link href={`/trip/${trip.id}/spend/${spend.id}/receipt`} asChild>
          <Pressable accessibilityRole="link" hitSlop={12}>
            <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }} color={colors.primary}>
              Open
            </Text>
          </Pressable>
        </Link>
      </Surface>

      <View style={styles.proof}>
        <View style={styles.dot} />
        <Text variant="caption" color={colors.textMuted}>
          Recorded on Monad ·{' '}
          <Text variant="caption" style={{ fontFamily: fonts.bodyBold }} color={colors.primary}>
            view proof
          </Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: colors.warmBg,
    alignItems: 'center',
    gap: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  lockTile: {
    width: 44,
    height: 44,
    borderRadius: radius.iconTile,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.positive,
  },
});

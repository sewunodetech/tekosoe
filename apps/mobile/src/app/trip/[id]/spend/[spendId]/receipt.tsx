import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Pop } from '@/components/decor';
import { ReceiptPaper } from '@/components/receipt-paper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pill, Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { combine, QueryState } from '@/components/query-state';
import type { Spend, Trip } from '@/data/types';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { money } from '@/lib/money';

// R2 Receipt, locked → R3 Receipt, unlocked — canvas "Final UI" › S08ReceiptLocked, S09ReceiptView
// TODO: api → receipts, group_keys; Envio ReceiptAttached. Buka kunci grup dengan Face ID (PRF Mera),
// unduh ciphertext, cocokkan keccak256 dengan receiptHash on-chain, lalu dekripsi di HP.
export default function ReceiptScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  return (
    <QueryState query={combine(useTrip(id), useSpend(spendId, id))} title="Receipt">
      {([trip, spend]) => <ReceiptView trip={trip} spend={spend} />}
    </QueryState>
  );
}

function ReceiptView({ trip, spend }: { trip: Trip; spend: Spend }) {
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const count = trip.members.length === 3 ? 'three' : String(trip.members.length);

  const handleUnlock = async () => {
    setUnlocking(true);
    // Simulate passkey biometric authentication + PRF group key decryption
    setTimeout(() => {
      setUnlocked(true);
      setUnlocking(false);
    }, 600);
  };

  return (
    <Screen
      footer={
        unlocked ? (
          <Button label="Done" onPress={() => router.back()} />
        ) : (
          <Button
            label={unlocking ? 'Authenticating...' : 'Unlock with Passkey'}
            icon={<Icon name="faceId" color={colors.textOnPrimary} strokeWidth={2} />}
            onPress={handleUnlock}
            disabled={unlocking}
          />
        )
      }>
      <ScreenHeader title="Receipt" right={unlocked ? <Pill label="Unlocked here" bg={colors.positiveBg} color={colors.positiveText} /> : undefined} />

      {unlocked ? (
        <Pop style={{ alignItems: 'center', paddingVertical: 8 }}>
          <ReceiptPaper
            style={{ width: 270 }}
            title={['IZAKAYA HANABI', 'Shibuya, Tokyo', '2026-10-09 20:38 · Table 7']}
            lines={[
              'dash',
              { label: 'Yakitori set x3', value: '¥6,000' },
              { label: 'Gyoza x2', value: '¥1,800' },
              { label: 'Drinks x6', value: '¥4,500' },
              { label: 'Service', value: '¥1,200' },
              'dash',
              { label: 'TOTAL', value: '¥13,500', bold: true },
              { label: 'Paid by card', value: '****4821' },
            ]}
          />
        </Pop>
      ) : (
        <View style={styles.locked}>
          {[60, 40, 100, 85, 92, 70, 100].map((w, i) => (
            <View
              key={i}
              style={[
                styles.skeleton,
                { width: `${w}%`, height: i === 0 || i === 6 ? 14 : 10 },
                i < 2 && { alignSelf: 'center' },
                (i === 2 || i === 6) && { marginTop: 12 },
                (i === 0 || i === 6) && { backgroundColor: palette.skeleton },
              ]}
            />
          ))}
          <View style={styles.lockOverlay}>
            <View style={styles.lockCircle}>
              <Icon name="lock" size={32} color={colors.primary} strokeWidth={2} />
            </View>
            <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }}>
              Encrypted receipt
            </Text>
            <Text variant="label" style={{ fontFamily: fonts.body, textAlign: 'center', lineHeight: 21 }} color={colors.textMuted}>
              Only the {count} of you can open it. Not even Tekosoe&apos;s servers can read it.
            </Text>
          </View>
        </View>
      )}

      <Surface style={{ paddingVertical: 6 }}>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>
              {spend.title} · {money(spend.amount)}
            </Text>
            <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
              Attached by {spend.paidBy.name} · Oct 9, 8:45 PM
            </Text>
          </View>
        </View>
        <Pressable accessibilityRole="link" style={styles.row}>
          {unlocked && <View style={styles.dot} />}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{unlocked ? 'Fingerprint matches Monad' : 'Fingerprint on Monad'}</Text>
            <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
              {unlocked ? `Same file ${spend.paidBy.name} attached, not changed since` : 'Proves this receipt has not been swapped'}
            </Text>
          </View>
          <Icon name="external" size={14} color={colors.primary} />
        </Pressable>
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  locked: {
    height: 400,
    borderRadius: radius.hero,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    paddingVertical: 34,
    paddingHorizontal: 40,
    gap: 12,
  },
  skeleton: {
    borderRadius: 7,
    backgroundColor: palette.sand,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(250, 248, 243, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 36,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.sand,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.positive,
  },
});

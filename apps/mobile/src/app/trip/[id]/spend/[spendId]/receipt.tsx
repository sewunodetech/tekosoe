import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

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
import { useOpenReceipt } from '@/features/spends/useOpenReceipt';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { isLive } from '@/lib/env';
import { money } from '@/lib/money';

/** Waktu struk dilampirkan, mis. "Oct 9, 8:45 PM". */
const receiptTime = (seconds: number) =>
  new Date(seconds * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// R2 Receipt, locked → R3 Receipt, unlocked — canvas "Final UI" › S08ReceiptLocked, S09ReceiptView
// Live (ADR 0008): unduh ciphertext, cocokkan keccak256 dengan receiptHash on-chain, lalu dekripsi di HP dengan
// kunci trip. Demo: foto yang dilampirkan di sesi ini, atau struk contoh.
export default function ReceiptScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  return (
    <QueryState query={combine(useTrip(id), useSpend(spendId, id))} title="Receipt">
      {([trip, spend]) => <ReceiptView trip={trip} spend={spend} />}
    </QueryState>
  );
}

function ReceiptView({ trip, spend }: { trip: Trip; spend: Spend }) {
  const open = useOpenReceipt(trip.id, spend);
  const unlocked = open.isSuccess;
  const photo = open.data?.uri;
  const count = trip.members.length === 3 ? 'three' : String(trip.members.length);
  const latest = spend.receipts?.[0];
  const missing = isLive && !latest;
  const attachedBy = latest ? latest.by.name : spend.paidBy.name;
  const attachedAt = latest ? receiptTime(latest.at) : 'Oct 9, 8:45 PM';

  return (
    <Screen
      footer={
        unlocked || missing ? (
          <Button label="Done" onPress={() => router.back()} />
        ) : (
          <View style={{ gap: 10 }}>
            <Button
              label={open.isPending ? 'Unlocking…' : 'Unlock with Passkey'}
              icon={<Icon name="faceId" color={colors.textOnPrimary} strokeWidth={2} />}
              onPress={() => open.mutate()}
              disabled={open.isPending}
            />
            {open.isError && (
              <Text variant="caption" color={colors.danger} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
                {open.error.message}
              </Text>
            )}
          </View>
        )
      }>
      <ScreenHeader title="Receipt" right={unlocked ? <Pill label="Unlocked here" bg={colors.positiveBg} color={colors.positiveText} /> : undefined} />

      {missing ? (
        <View style={[styles.locked, styles.empty]}>
          <View style={styles.lockCircle}>
            <Icon name="receipt" size={30} color={colors.primary} strokeWidth={2} />
          </View>
          <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }}>
            No receipt yet
          </Text>
          <Text variant="label" style={{ fontFamily: fonts.body, textAlign: 'center', lineHeight: 21 }} color={colors.textMuted}>
            {spend.paidBy.label === 'You' ? 'Add a photo from the payment details.' : `${spend.paidBy.name} hasn't added one yet.`}
          </Text>
        </View>
      ) : unlocked && photo ? (
        <Pop style={styles.photoWrap}>
          <Image source={{ uri: photo }} style={styles.photo} contentFit="contain" accessibilityLabel={`Receipt for ${spend.title}`} />
        </Pop>
      ) : unlocked ? (
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
              {missing ? 'Nothing attached yet' : `Attached by ${attachedBy} · ${attachedAt}`}
            </Text>
          </View>
        </View>
        {!missing && (
          <View style={styles.row}>
            {unlocked && <View style={styles.dot} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{unlocked ? 'Matches the original' : "Can't be swapped"}</Text>
              <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
                {unlocked ? `The same photo ${attachedBy} added, not changed since` : 'Locked in the moment it was added'}
              </Text>
            </View>
          </View>
        )}
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
  empty: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrap: {
    height: 420,
    borderRadius: radius.hero,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
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

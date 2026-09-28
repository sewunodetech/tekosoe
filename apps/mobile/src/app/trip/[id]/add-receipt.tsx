import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ReceiptPaper } from '@/components/receipt-paper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, Pill, Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useTrip } from '@/features/trips/useTrip';

// R1 Add receipt — canvas "Final UI" › S07ReceiptCapture
// TODO (M7): expo-camera / expo-document-picker → kompres → AES-GCM kunci grup → keccak256(ciphertext)
// → unggah lewat api → attachReceipt(groupId, spendId, receiptHash).
export default function AddReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <QueryState query={useTrip(id)} title="Add receipt" headerAction="close">
      {(trip) => <AddReceiptView trip={trip} />}
    </QueryState>
  );
}

function AddReceiptView({ trip }: { trip: Trip }) {
  const others = trip.members.filter((m) => m.label !== 'You').map((m) => m.name);

  return (
    <Screen
      gap={16}
      footer={
        <View style={styles.footer}>
          <Button label="Retake" variant="outline" style={{ flex: 1 }} />
          <Button label="Use photo" style={{ flex: 1 }} onPress={() => router.back()} />
        </View>
      }>
      <ScreenHeader title="Add receipt" action="close" />

      <View style={styles.camera}>
        <ReceiptPaper
          style={styles.paper}
          fontSize={11}
          title={['TICKET OFFICE', 'Shinjuku Station', '2026-10-11 09:12']}
          lines={['dash', { label: 'Tokyo - Kyoto' }, { label: 'Adult x3', value: '¥22,500' }, 'dash', { label: 'TOTAL', value: '¥22,500', bold: true }]}
        />
        <Corner style={{ left: 44, top: 44, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 14 }} />
        <Corner style={{ right: 44, top: 44, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 14 }} />
        <Corner style={{ left: 44, bottom: 44, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 14 }} />
        <Corner style={{ right: 44, bottom: 44, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 14 }} />
        <ScanLine />
        <View style={styles.hint}>
          <Pill label="Fit the whole receipt in the frame" weight="bold" />
        </View>
      </View>

      <View style={styles.pages}>
        <View style={styles.pageOn}>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 11 }} color={colors.primary}>
            1
          </Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.pageAdd}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11 }} color={colors.textMuted}>
            + Page
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={{ marginLeft: 'auto' }}>
          <Text variant="label" color={colors.primary}>
            Upload a PDF
          </Text>
        </Pressable>
      </View>

      <InfoBox icon={<Icon name="lock" size={18} color={colors.primary} strokeWidth={2} />}>
        Encrypted on this phone before upload. Only {others.join(', ').replace(/, ([^,]*)$/, ' and $1')} and you can open it.
      </InfoBox>
    </Screen>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} pointerEvents="none" />;
}

function ScanLine() {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * 300 }] }));
  return <Animated.View style={[styles.scan, anim]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  camera: {
    height: 430,
    borderRadius: radius.hero,
    backgroundColor: palette.cameraBg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 210,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 6,
    transform: [{ rotate: '-3deg' }],
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: colors.primary,
  },
  scan: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  hint: {
    position: 'absolute',
    top: 14,
  },
  pages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageOn: {
    width: 52,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageAdd: {
    width: 52,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

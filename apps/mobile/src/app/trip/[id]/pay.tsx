import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { combine, QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useSpend } from '@/features/spends/useSpend';
import { useCreateSpend } from '@/features/spends/useCreateSpend';
import { useTrip } from '@/features/trips/useTrip';
import { money, usd } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { DiscardModal } from '@/components/ui/discard-modal';

// 09 Pay from pot — canvas "Final UI" › F09Pay
// TODO (M4/M5): form nominal & penerima; computeNoteHash → spend(groupId, to, amount, participants, shares, noteHash).
// Di atas approvalThreshold jadi SpendRequested → S2 Waiting.
export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Draf demo: tiket kereta $150 (cerita desain). Diganti isian form di M5.
  const query = combine(useTrip(id), useSpend('train'));
  return (
    <QueryState query={query} title="Pay from the pot" headerAction="close">
      {([trip, spend]) => <PayView trip={trip} spend={spend} />}
    </QueryState>
  );
}


function PayView({ trip, spend }: { trip: Trip; spend: Spend }) {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState<string>('150');
  const amountNumber = parseInt(amountStr, 10) || 0;
  const amountVal = usd(amountNumber);

  const [split, setSplit] = useState<'equal' | 'custom'>('equal');
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(trip.members.map((m) => [m.id, true])),
  );

  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const isDirty =
    amountStr !== '150' ||
    split !== 'equal' ||
    trip.members.some((m) => included[m.id] === false) ||
    Object.keys(customShares).length > 0;

  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty,
    fallbackRoute: `/trip/${trip.id}`,
  });

  const overLimit = amountVal > trip.approvalLimit;
  const amountExceedsPot = amountVal > trip.pot;

  let isValid = amountNumber > 0 && !amountExceedsPot;
  let customSum = 0;

  if (split === 'equal') {
    const totalIncluded = Object.values(included).filter(Boolean).length;
    isValid = isValid && totalIncluded > 0;
  } else {
    for (const m of trip.members) {
      if (included[m.id]) {
        customSum += parseInt(customShares[m.id] || '0', 10);
      }
    }
    isValid = isValid && customSum === amountNumber;
    const totalIncluded = Object.values(included).filter(Boolean).length;
    isValid = isValid && totalIncluded > 0;
  }

  const createSpend = useCreateSpend(trip.id);
  const tx = useTx(createSpend.mutateAsync, {
    onSuccess: () => {
      if (overLimit) {
        router.replace(`/trip/${trip.id}/spend/new-spend/waiting`);
      } else {
        router.replace(`/trip/${trip.id}`);
      }
    }
  });

  return (
    <View style={{ flex: 1 }}>
      <Screen
        gap={16}
        footer={
          <Button
            label={overLimit ? 'Request approval' : `Pay ${money(amountVal)}`}
            disabled={!isValid || tx.isProcessing}
            onPress={() => tx.execute({ amount: amountNumber, splits: {} })} // splits dicatat di backend
          />
        }>
        <ScreenHeader title="Pay from the pot" action="close" onPress={handleBack} />

        <Surface style={styles.amountCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.amount}>$</Text>
            <TextInput
              style={styles.amount}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          {amountExceedsPot && (
            <Text variant="caption" color={colors.danger}>
              Cannot exceed pot balance ({money(trip.pot)})
            </Text>
          )}
          <View style={styles.what}>
            <Icon name="train" size={16} strokeWidth={2} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13 }}>{spend.title}</Text>
          </View>
          <Text variant="caption" color={colors.textMuted}>
            To JR Ticket Office (demo shop)
          </Text>
        </Surface>

        <Surface style={{ gap: 12 }}>
          <View style={styles.splitHeader}>
            <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>Who is this for?</Text>
            <View style={styles.segment} accessibilityRole="radiogroup">
              {(['equal', 'custom'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: split === mode }}
                  onPress={() => setSplit(mode)}
                  style={[styles.segmentItem, split === mode && styles.segmentOn]}>
                  <Text
                    style={{ fontFamily: split === mode ? fonts.bodyExtraBold : fonts.bodyBold, fontSize: 12 }}
                    color={split === mode ? colors.text : colors.textMuted}>
                    {mode === 'equal' ? 'Equal' : 'Custom'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {split === 'custom' && (
            <Text variant="caption" color={customSum === amountNumber ? colors.positive : colors.danger}>
              Custom split total: ${customSum} / ${amountNumber}
            </Text>
          )}

          {trip.members.map((member) => {
            const on = included[member.id];
            const equalShareAmount = Math.floor(amountNumber / Math.max(1, Object.values(included).filter(Boolean).length));

            return (
              <View key={member.id} style={styles.shareRow}>
                <Avatar name={member.name} tint={member.tint} size={30} />
                <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14 }}>{member.label}</Text>

                {split === 'equal' ? (
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{on ? money(usd(equalShareAmount)) : '—'}</Text>
                ) : (
                  on ? (
                    <TextInput
                      style={styles.customInput}
                      value={customShares[member.id] || ''}
                      onChangeText={(val) => setCustomShares(prev => ({ ...prev, [member.id]: val }))}
                      keyboardType="numeric"
                      placeholder="$0"
                    />
                  ) : (
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>—</Text>
                  )
                )}

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`Include ${member.label}`}
                  onPress={() => setIncluded((prev) => ({ ...prev, [member.id]: !prev[member.id] }))}
                  style={[styles.check, !on && styles.checkOff]}>
                  {on && <Icon name="check" size={14} color={colors.textOnPrimary} strokeWidth={3} />}
                </Pressable>
              </View>
            );
          })}
        </Surface>

        <Link href={`/trip/${trip.id}/add-receipt`} asChild>
          <Button label="Add receipt photo · only your group can see it" variant="dashed" icon={<Icon name="camera" size={18} strokeWidth={2} />} />
        </Link>

        {overLimit && (
          <View style={styles.warn}>
            <Teko mood="worry" size={60} bob={false} />
            <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19 }}>
              This is over {money(trip.approvalLimit).replace('.00', '')}, so one friend needs to say yes first.
            </Text>
          </View>
        )}
      </Screen>
      <TxOverlay status={tx.status} />
      <DiscardModal
        visible={showDiscardModal}
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={confirmExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  amountCard: {
    padding: 20,
    borderRadius: 26,
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 58,
    letterSpacing: -1.5,
    color: colors.text,
  },
  what: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.warmBg,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  segmentItem: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  segmentOn: {
    backgroundColor: colors.surface,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: palette.lineStrong,
  },
  customInput: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: palette.lineStrong,
    width: 60,
    textAlign: 'right',
    paddingVertical: 2,
    marginRight: 10,
  },
  warn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.row,
    backgroundColor: colors.warmBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

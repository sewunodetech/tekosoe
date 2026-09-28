import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { getTrip, money, spends } from '@/lib/demo';

// 09 Pay from pot — canvas "Final UI" › F09Pay
// TODO: computeNoteHash → spend(groupId, to, amount, participants, shares, noteHash).
// Di atas approvalThreshold jadi SpendRequested → S2 Waiting.
export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = getTrip(id);
  const spend = spends.train;
  const [split, setSplit] = useState<'equal' | 'custom'>('equal');
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(trip.members.map((m) => [m.id, true])),
  );
  const overLimit = spend.amount > trip.approvalLimit;

  return (
    <Screen
      gap={16}
      footer={
        <Link href={overLimit ? `/trip/${trip.id}/spend/${spend.id}/waiting` : `/trip/${trip.id}`} asChild>
          <Button label={overLimit ? 'Request approval' : `Pay ${money(spend.amount)}`} />
        </Link>
      }>
      <ScreenHeader title="Pay from the pot" action="close" />

      <Surface style={styles.amountCard}>
        <Text style={styles.amount}>$150</Text>
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
        {spend.shares.map(({ member, share }) => {
          const on = included[member.id];
          return (
            <View key={member.id} style={styles.shareRow}>
              <Avatar name={member.name} tint={member.tint} size={30} />
              <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14 }}>{member.label}</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{on ? money(share) : '—'}</Text>
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

import DateTimePicker from '@react-native-community/datetimepicker';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { colors, fonts, radius } from '@/constants/theme';
import { useCreateTrip } from '@/features/trips/useCreateTrip';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { DiscardModal } from '@/components/ui/discard-modal';

// 04 New trip — canvas "Final UI" › F04Create
// TODO: createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold) + api → group_meta.
export default function NewTripScreen() {
  const router = useRouter();
  const [name, setName] = useState('Japan Trip');
  const [nameTouched, setNameTouched] = useState(false);
  const [date, setDate] = useState(new Date('2026-10-14T00:00:00Z'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [limitStr, setLimitStr] = useState<string>('100');
  const [limitTouched, setLimitTouched] = useState(false);

  const parsedLimit = parseInt(limitStr, 10);
  const nameTrimmed = name.trim();

  const nameError =
    nameTouched && nameTrimmed.length === 0
      ? 'Trip name is required'
      : nameTouched && nameTrimmed.length < 3
      ? 'At least 3 characters'
      : undefined;

  const limitError =
    limitTouched && (isNaN(parsedLimit) || parsedLimit <= 0)
      ? 'Enter a valid amount'
      : limitTouched && parsedLimit < 10
      ? 'Minimum limit is $10'
      : limitTouched && parsedLimit > 5000
      ? 'Maximum limit is $5,000'
      : undefined;

  const [todayTimestamp] = useState(() => new Date().setHours(0, 0, 0, 0));
  const isFutureDate = date.getTime() >= todayTimestamp;
  const dateError = !isFutureDate ? 'End date must be in the future' : undefined;

  const isValid =
    nameTrimmed.length >= 3 &&
    !isNaN(parsedLimit) &&
    parsedLimit >= 10 &&
    parsedLimit <= 5000 &&
    isFutureDate;

  const isDirty = name !== 'Japan Trip' || limitStr !== '100' || date.toISOString().slice(0, 10) !== '2026-10-14';
  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty,
    fallbackRoute: '/trips',
  });

  const createTrip = useCreateTrip();
  const tx = useTx(createTrip.mutateAsync, {
    onSuccess: (data) => {
      router.replace(`/trip/${data.id}`);
    }
  });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setNameTouched(true);
    setLimitTouched(true);
    if (!isValid) return;
    tx.execute({ name: nameTrimmed, endsAt: date, limit: parsedLimit });
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen
        gap={18}
        footer={
          <Button
            label="Create trip"
            disabled={!isValid || tx.isProcessing}
            style={!isValid ? { opacity: 0.5 } : undefined}
            onPress={handleSubmit}
          />
        }>
        <ScreenHeader title="New trip" onPress={handleBack} />

        <TextField
          label="Trip name"
          value={name}
          onChangeText={(val) => {
            setNameTouched(true);
            setName(val);
          }}
          onBlur={() => setNameTouched(true)}
          error={nameError}
          placeholder="e.g. Japan Trip"
        />

        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextField
              label="Trip ends"
              value={date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              editable={false}
              error={dateError}
              icon={<Icon name="calendar" color={colors.primary} strokeWidth={2} />}
              hint="On this day Teko settles everyone up automatically."
            />
          </View>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
            onDismiss={() => setShowDatePicker(false)}
          />
        )}

        <View style={{ gap: 8 }}>
          <TextField
            label="Approval limit"
            value={limitStr}
            onChangeText={(val) => {
              setLimitTouched(true);
              setLimitStr(val);
            }}
            onBlur={() => setLimitTouched(true)}
            error={limitError}
            keyboardType="numeric"
            placeholder="100"
          />
          <ChoiceChips
            options={[50, 100, 200] as const}
            value={parsedLimit}
            onChange={(v) => {
              setLimitTouched(true);
              setLimitStr(String(v));
            }}
            format={(v) => `$${v}`}
            height={44}
          />
          <Text variant="caption" color={colors.textMuted}>
            Anything above this needs one friend to approve.
          </Text>
        </View>

        <View style={styles.invite}>
          <View style={styles.inviteTeko}>
            <Teko mood="wink" size={92} bob={false} />
          </View>
          <Text variant="label">Invite link</Text>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14 }} color={colors.heroText}>
            tekosoe.app/j/[invite-code]
          </Text>
          <View style={styles.inviteActions}>
            <Button
              label="Share link"
              variant="pill"
              onPress={() => Share.share({ message: `Join our trip "${name}" on Tekosoe: https://tekosoe.app/j/japan` })}
            />
            <Link href="/invite/japan" asChild>
              <Button label="Preview" variant="pill" />
            </Link>
          </View>
        </View>
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
  invite: {
    overflow: 'hidden',
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: colors.hero,
    gap: 12,
  },
  inviteTeko: {
    position: 'absolute',
    right: -8,
    bottom: -14,
    opacity: 0.95,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
});

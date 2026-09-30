import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { newTripFormSchema, type NewTripFormData } from '@/lib/form-schemas';
import { env, isLive } from '@/lib/env';
import { inviteUrl } from '@/lib/invite';

// 04 New trip — canvas "Final UI" › F04Create
// Live: createGroup(name, inviteKey, endsAt, disputeWindow, approvalThreshold, safetyNet) + api → group_meta.
// Rahasia undangan dibuat di HP; link dibagikan setelah trip ada.
export default function NewTripScreen() {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<NewTripFormData>({
    resolver: zodResolver(newTripFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: 'Japan Trip',
      limitStr: '100',
      endsAt: new Date('2026-10-14T00:00:00Z'),
    },
  });

  const tripName = useWatch({ control, name: 'name' });
  const limitStr = useWatch({ control, name: 'limitStr' });
  const endsAt = useWatch({ control, name: 'endsAt' }) ?? new Date('2026-10-14T00:00:00Z');

  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty,
    fallbackRoute: '/trips',
  });

  const createTrip = useCreateTrip();
  const tx = useTx(createTrip.mutateAsync, {
    onSuccess: (data) => {
      router.replace(`/trip/${data.id}`);
      if (isLive) {
        // Web browsers without navigator.share reject; the link is still available from Members.
        Share.share({ message: `Join our trip "${tripName}" on Tekosoe: ${inviteUrl(data.inviteCode)}` }).catch(() => undefined);
      }
    },
  });

  const onSubmit = (data: NewTripFormData) => {
    tx.execute({
      name: data.name.trim(),
      endsAt: data.endsAt,
      limit: parseInt(data.limitStr, 10),
    });
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
            onPress={handleSubmit(onSubmit)}
          />
        }>
        <ScreenHeader title="New trip" onPress={handleBack} />

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Trip name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              placeholder="e.g. Japan Trip"
            />
          )}
        />

        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextField
              label="Trip ends"
              value={endsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              editable={false}
              error={errors.endsAt?.message}
              icon={<Icon name="calendar" color={colors.primary} strokeWidth={2} />}
              hint="On this day Teko settles everyone up automatically."
            />
          </View>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={endsAt}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(_event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setValue('endsAt', selectedDate, { shouldValidate: true, shouldDirty: true });
              }
            }}
            onDismiss={() => setShowDatePicker(false)}
          />
        )}

        <View style={{ gap: 8 }}>
          <Controller
            control={control}
            name="limitStr"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Approval limit"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.limitStr?.message}
                keyboardType="numeric"
                placeholder="100"
              />
            )}
          />
          <ChoiceChips
            options={[50, 100, 200] as const}
            value={parseInt(limitStr, 10) || 100}
            onChange={(v) => {
              setValue('limitStr', String(v), { shouldValidate: true, shouldDirty: true });
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
            {isLive ? `${env.webDomain}/j/… · ready after you create the trip` : 'tekosoe.xyz/j/[invite-code]'}
          </Text>
          {!isLive && <View style={styles.inviteActions}>
            <Button
              label="Share link"
              variant="pill"
              onPress={() => Share.share({ message: `Join our trip "${tripName}" on Tekosoe: https://tekosoe.xyz/j/japan` })}
            />
            <Link href="/invite/japan" asChild>
              <Button label="Preview" variant="pill" />
            </Link>
          </View>}
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

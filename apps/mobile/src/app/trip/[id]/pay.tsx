import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { clearReceiptDraft, useReceiptDraft } from '@/features/spends/receipt-draft';
import { useAttachReceipt } from '@/features/spends/useAttachReceipt';
import { useCreateSpend } from '@/features/spends/useCreateSpend';
import { useTrip } from '@/features/trips/useTrip';
import { splitEqually } from '@tekosoe/shared';
import { isLive } from '@/lib/env';
import { money, parseAmountInput, sanitizeAmountInput } from '@/lib/money';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { DiscardModal } from '@/components/ui/discard-modal';
import { useNotifications } from '@/providers/notification-provider';
import { createPaySchema, type PayFormData } from '@/lib/form-schemas';

// 09 Pay from pot — canvas "Final UI" › F09Pay
// Live: computeNoteHash({title, category}) → spend(groupId, tokoDemo, amount, participants, shares, noteHash),
// lalu judul dikirim ke api. Di atas approvalThreshold jadi SpendRequested → S2 Waiting.
// Struk dari R1 disimpan sebagai draf dan dilampirkan setelah `spend` berhasil (butuh `spendId`).
export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <QueryState query={useTrip(id)} title="Pay from the pot" headerAction="close">
      {(trip) => <PayView trip={trip} />}
    </QueryState>
  );
}

const toAmount = (text: string | undefined) => parseAmountInput(text ?? '') ?? 0n;

function PayView({ trip }: { trip: Trip }) {
  const router = useRouter();
  // Draf demo: tiket kereta (cerita desain); nominal diisi user.
  const [title, setTitle] = useState('');
  const potMax = Number(trip.pot) / 1e6;

  const receiptUri = useReceiptDraft(trip.id);
  // Draf struk hanya berlaku untuk pembayaran yang sedang dibuat di layar ini.
  useEffect(() => () => clearReceiptDraft(trip.id), [trip.id]);

  const paySchema = useMemo(() => createPaySchema(potMax), [potMax]);

  const defaultIncluded: Record<string, boolean> = useMemo(
    () => Object.fromEntries(trip.members.map((m) => [m.id, true])),
    [trip.members],
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<PayFormData>({
    resolver: zodResolver(paySchema),
    mode: 'onChange',
    defaultValues: {
      amountStr: '',
      split: 'equal',
      included: defaultIncluded,
      customShares: {},
    },
  });

  const amountStr = useWatch({ control, name: 'amountStr' }) ?? '';
  const split = useWatch({ control, name: 'split' }) ?? 'equal';
  const included = useWatch({ control, name: 'included' }) ?? defaultIncluded;
  const customShares = useWatch({ control, name: 'customShares' }) ?? {};

  const amountVal = toAmount(amountStr);

  const { showDiscardModal, setShowDiscardModal, handleBack, confirmExit } = useUnsavedChanges({
    isDirty: isDirty || Boolean(receiptUri),
    fallbackRoute: `/trip/${trip.id}`,
  });

  const hasOtherMembers = trip.members.length > 1;
  const overLimit = hasOtherMembers && amountVal > trip.approvalLimit;

  const people = trip.members.filter((m) => included[m.id]);
  const equalShares = splitEqually(amountVal, Math.max(1, people.length));
  const equalShareOf = (memberId: string) => equalShares[people.findIndex((m) => m.id === memberId)] ?? 0n;
  const customSum = people.reduce((sum, m) => sum + toAmount(customShares[m.id]), 0n);

  const { notify } = useNotifications();
  const attachReceipt = useAttachReceipt(trip.id);
  const createSpend = useCreateSpend(trip.id);
  const tx = useTx(createSpend.mutateAsync, {
    onSuccess: (result) => {
      // Demo: permintaan di atas batas memakai pemakaian cerita `train` ($150 tiket kereta) supaya layar berikutnya cocok.
      const spendId = !isLive && overLimit ? 'train' : result.spendId;
      if (receiptUri) {
        // Dilampirkan di latar belakang setelah pembayaran tercatat; hasilnya dikabarkan lewat banner.
        attachReceipt
          .mutateAsync({ receiptUri, spendId })
          .then(() =>
            notify({
              title: 'Receipt added',
              body: `Encrypted and saved for ${title.trim()}. Only your trip can open it.`,
              data: { url: `/trip/${trip.id}/spend/${spendId}` },
            }),
          )
          .catch((error: unknown) =>
            notify({
              title: 'Receipt not saved',
              body: `${error instanceof Error ? error.message : 'Please try again.'} You can add it from the payment details.`,
              data: { url: `/trip/${trip.id}/spend/${spendId}` },
            }),
          );
      }
      // Demo: mock tidak tahu batas trip, jadi pakai `overLimit` dari layar.
      if (result.pending || (!isLive && overLimit)) {
        notify({
          title: 'Approval requested',
          body: `You requested approval to pay ${money(amountVal)} for ${title.trim()}.`,
          data: { url: `/trip/${trip.id}/spend/${spendId}/waiting` },
        });
        router.replace(`/trip/${trip.id}/spend/${spendId}/waiting`);
      } else {
        notify({
          title: 'Payment sent',
          body: `Paid ${money(amountVal)} from ${trip.name} pot.`,
          data: { url: `/trip/${trip.id}` },
        });
        router.replace(`/trip/${trip.id}`);
      }
    },
  });

  const onSubmit = (data: PayFormData) => {
    const amount = toAmount(data.amountStr);
    const payers = trip.members.filter((m) => data.included[m.id]);
    const shares =
      data.split === 'equal' ? splitEqually(amount, payers.length) : payers.map((m) => toAmount(data.customShares[m.id]));
    tx.execute({
      amount,
      title: title.trim() || 'Payment',
      category: 'other',
      participants: payers.map((m) => m.id),
      shares,
    });
  };

  const validationErrorMessage =
    errors.amountStr?.message ??
    (typeof errors.included?.message === 'string' ? errors.included.message : undefined) ??
    (typeof errors.split?.message === 'string' ? errors.split.message : undefined);

  const label = !amountVal ? 'Enter an amount' : overLimit ? 'Request approval' : `Pay ${money(amountVal)}`;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        gap={16}
        footer={
          <Button
            label={label}
            disabled={!isValid || tx.isProcessing || !title.trim()}
            onPress={handleSubmit(onSubmit)}
          />
        }>
        <ScreenHeader title="Pay from the pot" action="close" onPress={handleBack} />

        <Surface style={styles.amountCard}>
          <Controller
            control={control}
            name="amountStr"
            render={({ field: { onChange, value } }) => (
              <AmountInput
                value={value}
                onChange={onChange}
                hint={validationErrorMessage ?? `The pot has ${money(trip.pot)}`}
                error={Boolean(validationErrorMessage)}
                accessibilityLabel="Amount to pay"
              />
            )}
          />
          <View style={styles.what}>
            <Icon name="train" size={16} strokeWidth={2} />
            <TextInput
              style={styles.title}
              value={title}
              onChangeText={setTitle}
              placeholder="What is it for?"
              placeholderTextColor={colors.textMuted}
              maxLength={80}
              accessibilityLabel="What is it for?"
            />
          </View>
          <Text variant="caption" color={colors.textMuted}>
            {isLive ? 'To the demo shop' : 'To JR Ticket Office (demo shop)'}
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
                  onPress={() => setValue('split', mode, { shouldValidate: true, shouldDirty: true })}
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
            <Text variant="caption" color={customSum === amountVal ? colors.positive : colors.danger}>
              Custom split total: {money(customSum)} / {money(amountVal)}
            </Text>
          )}

          {trip.members.map((member) => {
            const on = included[member.id] ?? false;

            return (
              <View key={member.id} style={styles.shareRow}>
                <Avatar name={member.name} tint={member.tint} size={30} />
                <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14 }}>{member.label}</Text>

                {split === 'equal' ? (
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{on ? money(equalShareOf(member.id)) : '—'}</Text>
                ) : on ? (
                  <TextInput
                    style={styles.customInput}
                    value={customShares[member.id] || ''}
                    onChangeText={(val) => {
                      const updated = { ...customShares, [member.id]: sanitizeAmountInput(val) };
                      setValue('customShares', updated, { shouldValidate: true, shouldDirty: true });
                    }}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="$0"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={`Share for ${member.label}`}
                  />
                ) : (
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>—</Text>
                )}

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(on) }}
                  accessibilityLabel={`Include ${member.label}`}
                  onPress={() => {
                    const updated = { ...included, [member.id]: !on };
                    setValue('included', updated, { shouldValidate: true, shouldDirty: true });
                  }}
                  style={[styles.check, !on && styles.checkOff]}>
                  {on && <Icon name="check" size={14} color={colors.textOnPrimary} strokeWidth={3} />}
                </Pressable>
              </View>
            );
          })}
        </Surface>

        {receiptUri ? (
          <Surface style={styles.receiptRow}>
            <Image source={{ uri: receiptUri }} style={styles.receiptThumb} contentFit="cover" accessibilityLabel="Receipt photo" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label">Receipt added</Text>
              <Text variant="caption" color={colors.textMuted}>
                Only your group can see it
              </Text>
            </View>
            <Link href={`/trip/${trip.id}/add-receipt`} asChild>
              <Pressable accessibilityRole="button" hitSlop={8}>
                <Text variant="label" color={colors.primary}>
                  Retake
                </Text>
              </Pressable>
            </Link>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove receipt"
              hitSlop={8}
              onPress={() => clearReceiptDraft(trip.id)}
              style={styles.receiptRemove}>
              <Icon name="close" size={16} color={colors.textMuted} strokeWidth={2.4} />
            </Pressable>
          </Surface>
        ) : (
          <Link href={`/trip/${trip.id}/add-receipt`} asChild>
            <Button
              label="Add receipt photo · only your group can see it"
              variant="dashed"
              icon={<Icon name="camera" size={18} strokeWidth={2} />}
            />
          </Link>
        )}

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
    gap: 12,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
    minWidth: 120,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as object,
  what: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.warmBg,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.row,
  },
  receiptThumb: {
    width: 44,
    height: 56,
    borderRadius: 10,
    backgroundColor: palette.cameraBg,
  },
  receiptRemove: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 72,
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

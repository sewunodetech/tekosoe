import DateTimePicker from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Teko } from '@/components/teko';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { colors, fonts, radius } from '@/constants/theme';

// 04 New trip — canvas "Final UI" › F04Create
// TODO: createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold) + api → group_meta.
export default function NewTripScreen() {
  const [name, setName] = useState('Japan Trip');
  const [date, setDate] = useState(new Date('2026-10-14T00:00:00Z'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [limitStr, setLimitStr] = useState<string>('100');

  const parsedLimit = parseInt(limitStr, 10);
  const isValid = name.trim().length > 0 && !isNaN(parsedLimit) && parsedLimit > 0;

  return (
    <Screen
      gap={18}
      footer={
        <Link href="/trip/japan" asChild>
          <Button label="Create trip" disabled={!isValid} />
        </Link>
      }>
      <ScreenHeader title="New trip" />

      <TextField label="Trip name" value={name} onChangeText={setName} />
      
      <Pressable onPress={() => setShowDatePicker(true)}>
        <View pointerEvents="none">
          <TextField
            label="Trip ends"
            value={date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            editable={false}
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
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      <View style={{ gap: 8 }}>
        <Text variant="label">Approval limit</Text>
        <TextField
          label="Approval limit"
          value={limitStr}
          onChangeText={setLimitStr}
          keyboardType="numeric"
        />
        <ChoiceChips 
          options={[50, 100, 200] as const} 
          value={parsedLimit} 
          onChange={(v) => setLimitStr(String(v))} 
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
          <Link href="/invite/japan" asChild>
            <Button label="Copy link" variant="pill" />
          </Link>
          <Link href="/invite/japan" asChild>
            <Button label="Share" variant="pill" />
          </Link>
        </View>
      </View>
    </Screen>
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

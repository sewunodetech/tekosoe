import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { Text } from './text';

type Props = TextInputProps & { label: string; hint?: string; icon?: ReactNode };

/** Input dengan label di atas dan petunjuk di bawah (F04 New trip). */
export function TextField({ label, hint, icon, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <View>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, icon ? { paddingLeft: 48 } : null, style]}
          {...rest}
        />
      </View>
      {hint ? (
        <Text variant="caption" color={colors.textMuted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  input: {
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
  },
  icon: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 1,
  },
});

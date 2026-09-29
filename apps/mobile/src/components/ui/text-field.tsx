import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { Text } from './text';

type Props = TextInputProps & { label: string; hint?: string; error?: string; icon?: ReactNode };

/** Input dengan label di atas dan petunjuk di bawah (F04 New trip). */
export function TextField({ label, hint, error, icon, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="label">{label}</Text>
        {error ? (
          <Text variant="caption" color={colors.danger} style={{ fontFamily: fonts.bodyBold }}>
            {error}
          </Text>
        ) : null}
      </View>
      <View>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            icon ? { paddingLeft: 48 } : null,
            error ? styles.inputError : null,
            style,
          ]}
          {...rest}
        />
      </View>
      {hint && !error ? (
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#fffcfb',
  },
  icon: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 1,
  },
});

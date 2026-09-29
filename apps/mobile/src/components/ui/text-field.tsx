import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { Text } from './text';

type Props = TextInputProps & { label: string; hint?: string; error?: string; icon?: ReactNode };

/** Input dengan label di atas dan petunjuk/pesan error di bawah rata kiri. */
export function TextField({ label, hint, error, icon, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
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
      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.errorText}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={colors.textMuted} style={styles.hintText}>
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
  errorText: {
    fontFamily: fonts.bodyBold,
    textAlign: 'left',
    marginTop: -2,
  },
  hintText: {
    textAlign: 'left',
    marginTop: -2,
  },
});

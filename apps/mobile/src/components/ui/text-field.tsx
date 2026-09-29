import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { Text } from './text';

type Props = TextInputProps & { label: string; hint?: string; error?: string; icon?: ReactNode };

/** Input dengan label di atas, petunjuk di kiri bawah, dan pesan error di kanan bawah. */
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
      {hint || error ? (
        <View style={styles.footerRow}>
          {hint ? (
            <Text variant="caption" color={colors.textMuted} style={styles.hintText}>
              {hint}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {error ? (
            <Text variant="caption" color={colors.danger} style={styles.errorText}>
              {error}
            </Text>
          ) : null}
        </View>
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: -2,
  },
  hintText: {
    flex: 1,
  },
  errorText: {
    fontFamily: fonts.bodyBold,
    textAlign: 'left',
    marginLeft: 'auto',
  },
});

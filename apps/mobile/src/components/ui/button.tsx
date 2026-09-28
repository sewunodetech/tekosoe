import { forwardRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type View } from 'react-native';

import { colors, fonts, radius, type as typeScale } from '@/constants/theme';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dashed' | 'pill';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
};

/**
 * Tombol dari desain:
 * - primary: teal penuh, tinggi 56 (CTA utama di bawah layar)
 * - outline: putih bergaris, tinggi 52 ("Decline", "Preview settle-up")
 * - ghost: teks teal, tinggi 44 ("I already have an account", "Plan another trip")
 * - dashed: garis putus-putus ("Add receipt photo", tautan demo)
 * - pill: pil putih kecil ("Copy link", "Share")
 * Bisa dipakai di dalam <Link asChild>.
 */
export const Button = forwardRef<View, Props>(function Button({ label, variant = 'primary', icon, style, ...rest }, ref) {
  const textColor =
    variant === 'primary' ? colors.textOnPrimary : variant === 'ghost' ? colors.primary : colors.text;
  const textStyle =
    variant === 'pill' || variant === 'dashed' ? { fontFamily: fonts.bodyBold, fontSize: 14 } : variant === 'outline' ? { ...typeScale.button, fontSize: 15 } : typeScale.button;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && pressedStyles[variant],
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {icon}
      <Text style={textStyle} color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.button,
  },
  primary: {
    height: 56,
    backgroundColor: colors.primary,
  },
  outline: {
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    height: 44,
  },
  dashed: {
    minHeight: 56,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  pill: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primaryPressed },
  outline: { backgroundColor: colors.surfaceMuted },
  ghost: { opacity: 0.6 },
  dashed: { backgroundColor: colors.surfaceMuted },
  pill: { backgroundColor: colors.surfaceMuted },
});

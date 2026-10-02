import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import { Text } from './text';

type Props<T extends string | number> = {
  options: readonly T[];
  /** `null` = belum ada yang dipilih (isian mulai kosong). */
  value: T | null;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  /** "teal" (nominal) atau "ink" (safety net di F06, di atas kartu cream). */
  tone?: 'teal' | 'ink';
  /** Chip tanpa garis tepi (di atas latar berwarna). */
  borderless?: boolean;
  height?: number;
  center?: boolean;
};

/** Pilihan nominal berbentuk pil ($50 / $100 / $200). */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  format = (v) => String(v),
  tone = 'teal',
  borderless = false,
  height = 40,
  center = false,
}: Props<T>) {
  return (
    <View style={[styles.row, center && { justifyContent: 'center' }]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={String(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              { height, borderRadius: height / 2 },
              !borderless && !selected && styles.bordered,
              selected && { backgroundColor: tone === 'teal' ? colors.primary : colors.text },
            ]}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }} color={selected ? colors.textOnPrimary : colors.text}>
              {format(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  bordered: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});

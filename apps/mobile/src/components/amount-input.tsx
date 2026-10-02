import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { cleanAmountTyping, groupAmountInput } from '@/lib/money';

export type AmountPreset = { label: string; value: string };

/**
 * Lebar isian mengikuti jumlah karakter (Bricolage 56px ≈ 34px per angka, titik/koma lebih sempit),
 * supaya "$" tetap menempel di angka — TextInput tidak menyesuaikan lebar sendiri di web.
 */
function inputWidth(shown: string): number {
  const text = shown || '0';
  const narrow = (text.match(/[.,]/g) ?? []).length;
  return (text.length - narrow) * 34 + narrow * 16 + 6;
}

type Props = {
  value: string;
  onChange: (text: string) => void;
  /** Tombol cepat di bawah isian, mis. $50 / $100 / Max. */
  presets?: AmountPreset[];
  /** Baris kecil di bawah angka ("You have $420.00"); merah kalau `error`. */
  hint: string;
  error?: boolean;
  accessibilityLabel: string;
};

/**
 * Isian nominal besar gaya dompet: "$" + angka yang diketik bebas (dengan pemisah ribuan),
 * tombol cepat di bawahnya. Saat kosong, area angka bergaris putus-putus. Ketuk di mana pun
 * di area angka untuk membuka keyboard. Maks. $99,999.
 */
export function AmountInput({ value, onChange, presets = [], hint, error = false, accessibilityLabel }: Props) {
  const input = useRef<TextInput>(null);
  const shown = groupAmountInput(value);

  return (
    <View style={{ gap: 14 }}>
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={[styles.amountRow, !value && styles.amountRowEmpty]}>
        <Text style={[styles.amount, !value && styles.placeholder]}>$</Text>
        <TextInput
          ref={input}
          value={shown}
          onChangeText={(typed) => {
            const next = cleanAmountTyping(typed);
            if (next !== null) onChange(next);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0"
          placeholderTextColor={colors.borderStrong}
          accessibilityLabel={accessibilityLabel}
          maxLength={9}
          style={[styles.amount, styles.input, { width: inputWidth(shown) }]}
        />
      </Pressable>
      <Text
        variant="label"
        style={{ fontFamily: fonts.body, textAlign: 'center' }}
        color={error ? colors.danger : colors.textMuted}
        accessibilityLiveRegion="polite">
        {hint}
      </Text>
      {presets.length > 0 && (
        <View style={styles.presets}>
          {presets.map((preset) => {
            const active = preset.value === value;
            return (
              <Pressable
                key={preset.label}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(preset.value)}
                style={[styles.preset, active && styles.presetActive]}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }} color={active ? colors.textOnPrimary : colors.text}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minHeight: 80,
    paddingHorizontal: 24,
    borderRadius: radius.hero,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountRowEmpty: {
    backgroundColor: colors.surface,
    borderStyle: 'dashed',
    borderColor: palette.lineStrong,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.5,
    color: colors.text,
  },
  placeholder: {
    color: colors.borderStrong,
  },
  input: {
    padding: 0,
    textAlign: 'left',
    outlineStyle: 'none',
  } as object,
  presets: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  preset: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: palette.line,
  },
  presetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

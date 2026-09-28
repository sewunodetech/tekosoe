import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, palette } from '@/constants/theme';
import { Text } from './ui/text';

const MONO = Platform.select({ ios: 'Courier New', android: 'monospace', default: "'Courier New', monospace" });

export type ReceiptLine = { label: string; value?: string; bold?: boolean } | 'dash';

/** Kertas struk bergaya monospace (R1 kamera, R3 struk terbuka). */
export function ReceiptPaper({
  title,
  lines,
  fontSize = 12.5,
  style,
}: {
  title: string[];
  lines: ReceiptLine[];
  fontSize?: number;
  style?: ViewStyle;
}) {
  const text = { fontFamily: MONO, fontSize, lineHeight: fontSize * 1.55, color: palette.inkSoft };
  return (
    <View style={[styles.paper, style]}>
      {title.map((t, i) => (
        <Text key={t} style={[text, styles.center, i === 0 && { fontWeight: '700', fontSize: fontSize + 1.5 }]}>
          {t}
        </Text>
      ))}
      {lines.map((line, i) =>
        line === 'dash' ? (
          <View key={i} style={styles.dash} />
        ) : (
          <View key={i} style={styles.row}>
            <Text style={[text, line.bold && { fontWeight: '700' }]}>{line.label}</Text>
            {line.value ? <Text style={[text, line.bold && { fontWeight: '700' }]}>{line.value}</Text> : null}
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 20,
    boxShadow: '0 14px 30px rgba(29, 36, 38, 0.10)',
  },
  center: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dash: {
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    marginVertical: 6,
  },
});

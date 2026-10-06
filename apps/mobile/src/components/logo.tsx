import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { Text } from './ui/text';

/** Wordmark "tekosue" teal + titik oranye, seperti di F01 Welcome, F05 Invite, dan kartu F12. */
export function Logo({ size = 24, dot = true }: { size?: number; dot?: boolean }) {
  const dotSize = Math.max(6, Math.round(size / 3));
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Tekosue">
      <Text style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.2, letterSpacing: -size / 48 }} color={colors.primary}>
        tekosue
      </Text>
      {dot && <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: colors.accent }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

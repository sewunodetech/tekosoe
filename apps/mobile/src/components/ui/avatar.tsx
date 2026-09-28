import { StyleSheet, View } from 'react-native';

import { avatarColors, fonts } from '@/constants/theme';
import { Text } from './text';

type Props = {
  name: string;
  size?: number;
  /** Warna latar. Kalau kosong, dipilih dari `avatarColors` lewat `colorIndex`. */
  tint?: string;
  colorIndex?: number;
  borderColor?: string;
};

/** Lingkaran berinisial untuk anggota trip (R, W, J di desain). */
export function Avatar({ name, size = 34, tint, colorIndex = 0, borderColor }: Props) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint ?? avatarColors[colorIndex % avatarColors.length],
        },
        borderColor ? { borderWidth: 2, borderColor } : null,
      ]}>
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: Math.round(size * 0.38) }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

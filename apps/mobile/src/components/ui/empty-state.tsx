import { StyleSheet, View } from 'react-native';

import { Teko, type TekoMood } from '@/components/teko';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { Text } from './text';

type Props = {
  title: string;
  description?: string;
  /** Ekspresi Teko mengikuti layar (mis. `sleep` di Notifications, `think` di Card). */
  mood?: TekoMood;
};

/** Kartu kosong bergaris putus-putus: Teko + judul + satu kalimat penjelas. */
export function EmptyState({ title, description, mood = 'idle' }: Props) {
  return (
    <View style={styles.container}>
      <Teko mood={mood} size={88} bob={false} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text variant="caption" color={colors.textMuted} style={styles.desc}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.lineStrong,
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    maxWidth: 260,
  },
});

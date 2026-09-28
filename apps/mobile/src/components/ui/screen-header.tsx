import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { Icon } from './icon';
import { Text } from './text';

type Props = {
  title?: string;
  /** "back" untuk layar biasa, "close" untuk modal (Add money, Pay, Approval). */
  action?: 'back' | 'close';
  right?: React.ReactNode;
};

/** Header layar: tombol bulat putih 44px + judul Bricolage 20px, seperti di desain. */
export function ScreenHeader({ title, action = 'back', right }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action === 'back' ? 'Back' : 'Close'}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.circle}>
        <Icon name={action} />
      </Pressable>
      {title ? (
        <Text variant="h3" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});

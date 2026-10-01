import { StyleSheet, View } from 'react-native';

import { Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { Teko } from '@/components/teko';
import { colors, fonts, radius } from '@/constants/theme';

export default function NotificationsScreen() {
  return (
    <Screen gap={18}>
      <ScreenHeader title="Notifications" action="back" />

      <View style={styles.emptyState}>
        <Teko mood="sleep" size={140} bob={false} />
        <Text variant="h2" color={colors.sleepText} style={{ marginTop: 8 }}>All caught up!</Text>
        <Text variant="label" color={colors.sleepText} style={{ fontFamily: fonts.body, maxWidth: 260, textAlign: 'center', lineHeight: 21, marginTop: 4 }}>
          When friends request approvals or settle up, it will appear here.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 32,
    borderRadius: radius.hero,
    backgroundColor: colors.sleepBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
});

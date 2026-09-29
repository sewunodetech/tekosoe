import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Teko } from '@/components/teko';
import { Text } from '@/components/ui/text';
import { colors, fonts, radius } from '@/constants/theme';
import type { TxStatus } from './useTx';

type Props = {
  status: TxStatus;
};

export function TxOverlay({ status }: Props) {
  if (status === 'idle') return null;

  return (
    <Animated.View style={styles.overlay} entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <View style={styles.card}>
        <View style={styles.tekoWrap}>
          {status === 'processing' && <Teko mood="think" size={100} />}
          {status === 'done' && <Teko mood="cheer" size={100} />}
          {status === 'error' && <Teko mood="sad" size={100} />}
        </View>
        <Text variant="h2" style={styles.text}>
          {status === 'processing' && 'Processing...'}
          {status === 'done' && 'Done!'}
          {status === 'error' && 'Failed'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 36, 38, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: radius.card,
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  },
  tekoWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
  },
});

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Teko, type TekoMood } from '@/components/teko';
import { Icon } from '@/components/ui/icon';
import { colors } from '@/constants/theme';

/** Ikon Face ID dengan garis pindai + Teko di pojok (02 Sign in, Unlock). */
export function PasskeyBadge({ mood = 'wink' }: { mood?: TekoMood }) {
  return (
    <View style={styles.badgeWrap}>
      <View style={styles.halo} />
      <View style={styles.faceTile}>
        <Icon name="faceId" size={58} color={colors.primary} strokeWidth={1.6} />
        <ScanLine />
      </View>
      <View style={styles.teko}>
        <Teko mood={mood} size={84} />
      </View>
    </View>
  );
}

/** Garis pindai oranye yang naik-turun di atas ikon Face ID. */
function ScanLine() {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: -30 + y.value * 60 }] }));
  return <Animated.View style={[styles.scan, anim]} />;
}

const styles = StyleSheet.create({
  badgeWrap: {
    width: 200,
    height: 200,
  },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 100,
    backgroundColor: colors.hero,
  },
  faceTile: {
    position: 'absolute',
    left: 50,
    top: 50,
    width: 100,
    height: 100,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(31, 122, 110, 0.14)',
  },
  scan: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.85,
  },
  teko: {
    position: 'absolute',
    right: -24,
    bottom: -8,
  },
});

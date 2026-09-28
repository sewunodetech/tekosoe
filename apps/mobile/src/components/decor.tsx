import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts, palette } from '@/constants/theme';
import { Text } from './ui/text';

/** Bintang empat sudut yang berkelip (kelas `tw` di desain). */
export function Sparkle({ size = 20, color = colors.accent, style, delay = 0 }: { size?: number; color?: string; style?: ViewStyle; delay?: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    t.value = withDelay(delay, withRepeat(withTiming(0.72, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [delay, reduce, t]);
  const anim = useAnimatedStyle(() => ({
    opacity: 0.55 + (t.value - 0.72) * (0.45 / 0.28),
    transform: [{ scale: t.value }, { rotate: `${(1 - t.value) * 90}deg` }],
  }));
  return (
    <Animated.View style={[styles.abs, style, anim]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Koin kuning bergaris ink dengan tanda $ (F01, F08). */
export function Coin({ size = 28, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View
      style={[
        styles.abs,
        styles.coin,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      pointerEvents="none">
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: Math.round(size * 0.43) }}>$</Text>
    </View>
  );
}

/** Wrapper naik-turun pelan (kelas `bob` di desain). */
export function Bob({ children, style, distance = 6, duration = 3200, delay = 0 }: { children: React.ReactNode; style?: ViewStyle; distance?: number; duration?: number; delay?: number }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distance, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [delay, distance, duration, reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Muncul membesar sekali (kelas `pop` di desain: 0.4 → 1.06 → 1). */
export function Pop({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(reduce ? 1 : 0.4);
  useEffect(() => {
    if (reduce) return;
    s.value = withSequence(
      withTiming(1.06, { duration: 490, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
      withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) }),
    );
  }, [reduce, s]);
  const anim = useAnimatedStyle(() => ({ opacity: Math.min(1, (s.value - 0.4) / 0.4), transform: [{ scale: s.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Titik hijau berdenyut untuk transaksi yang baru selesai (kelas `pulse`). */
export function PulseDot({ color = colors.positive, size = 7 }: { color?: string; size?: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1);
  }, [p, reduce]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - p.value), transform: [{ scale: 1 + p.value * 2.2 }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: color }, ring]} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

/** Confetti jatuh untuk layar Settled (F13). */
export function Confetti() {
  const pieces = [
    { left: 24, color: palette.orange, ms: 5200, delay: 0 },
    { left: 70, color: palette.mintBright, ms: 6100, delay: 1200 },
    { left: 118, color: palette.coin, ms: 4800, delay: 500 },
    { left: 166, color: palette.lilac, ms: 5600, delay: 2000 },
    { left: 214, color: palette.orange, ms: 6400, delay: 900 },
    { left: 262, color: palette.mintBright, ms: 5000, delay: 2600 },
    { left: 310, color: palette.coin, ms: 5800, delay: 200 },
    { left: 352, color: palette.lilac, ms: 4600, delay: 1600 },
    { left: 44, color: palette.coin, ms: 6600, delay: 3100 },
    { left: 238, color: palette.orange, ms: 5400, delay: 3600 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ left, color, ms, delay }: { left: number; color: string; ms: number; delay: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1));
  }, [delay, ms, reduce, t]);
  const anim = useAnimatedStyle(() => ({
    opacity: reduce ? 0 : 1,
    transform: [{ translateY: -60 + t.value * 960 }, { rotate: `${t.value * 540}deg` }],
  }));
  return <Animated.View style={[styles.piece, { left, backgroundColor: color }, anim]} />;
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  coin: {
    backgroundColor: palette.coin,
    borderWidth: 2.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    top: 0,
    width: 9,
    height: 14,
    borderRadius: 3,
  },
});

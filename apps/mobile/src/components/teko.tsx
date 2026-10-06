import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * Teko, maskot Tekosue — port dari canvas "Final UI" › Teko.dc.html (10 ekspresi).
 * SVG asli memakai animasi SMIL yang tidak didukung React Native, jadi tiap pose digambar sebagai
 * frame diam yang paling khas, dan gerakan (naik-turun + goyang) dibuat dengan Reanimated.
 */
export type TekoMood = 'idle' | 'cheer' | 'pour' | 'fill' | 'wink' | 'love' | 'think' | 'worry' | 'sad' | 'sleep';

type EyeKind = 'open' | 'look' | 'happy' | 'wink' | 'sleep' | 'heart';
type MouthKind = 'cat' | 'open' | 'o' | 'tongue' | 'wavy' | 'frown' | 'hmm' | 'snore';
type Fx = 'steam' | 'spark' | 'pour' | 'fill' | 'hearts' | 'think' | 'sweat' | 'tear' | 'zzz' | 'none';

type Pose = {
  eyes: EyeKind;
  mouth: MouthKind;
  fx: Fx;
  open?: boolean;
  brows?: boolean;
  blush?: boolean;
  /** Transform badan Teko (di dalam viewBox 200). */
  body?: string;
  /** Transform tutup teko. */
  lid: string;
  /** Sudut goyang (derajat) dan durasi satu siklus (ms). */
  sway: number;
  swayMs: number;
  label: string;
};

const POSES: Record<TekoMood, Pose> = {
  idle: { eyes: 'open', mouth: 'cat', fx: 'steam', lid: '', sway: 2.5, swayMs: 3600, label: 'Teko, happy and ready' },
  cheer: {
    eyes: 'happy',
    mouth: 'open',
    fx: 'spark',
    open: true,
    lid: 'translate(0 -16) rotate(-10 100 82)',
    sway: 6,
    swayMs: 1100,
    label: 'Teko cheering',
  },
  pour: {
    eyes: 'happy',
    mouth: 'cat',
    fx: 'pour',
    // Frame: Teko di atas gelas tengah, miring sedang menuang (pivot di ujung corong).
    body: 'translate(54.5 30) translate(15.5 54.6) rotate(-32) translate(-15.5 -54.6) scale(0.62)',
    lid: '',
    sway: 0,
    swayMs: 3000,
    label: 'Teko filling all three glasses',
  },
  fill: {
    eyes: 'open',
    mouth: 'o',
    fx: 'fill',
    open: true,
    lid: 'translate(20 -22) rotate(26 100 82)',
    sway: 1.5,
    swayMs: 2400,
    label: 'Teko receiving coins',
  },
  wink: { eyes: 'wink', mouth: 'tongue', fx: 'none', lid: 'translate(-3 -3) rotate(-9 100 82)', sway: 3, swayMs: 2600, label: 'Teko winking' },
  love: { eyes: 'heart', mouth: 'open', fx: 'hearts', blush: true, lid: 'translate(0 -6)', sway: 3, swayMs: 2000, label: 'Teko in love' },
  think: {
    eyes: 'look',
    mouth: 'hmm',
    fx: 'think',
    body: 'rotate(-5 100 176)',
    lid: 'rotate(6 100 82)',
    sway: 1.5,
    swayMs: 3400,
    label: 'Teko thinking',
  },
  worry: { eyes: 'open', mouth: 'wavy', fx: 'sweat', brows: true, lid: '', sway: 1.2, swayMs: 450, label: 'Teko a little worried' },
  sad: {
    eyes: 'open',
    mouth: 'frown',
    fx: 'tear',
    brows: true,
    body: 'translate(0 4)',
    lid: 'translate(-2 2) rotate(-7 100 82)',
    sway: 0.8,
    swayMs: 4000,
    label: 'Teko sad',
  },
  sleep: { eyes: 'sleep', mouth: 'snore', fx: 'zzz', lid: 'translate(5 -1) rotate(10 100 82)', sway: 1.2, swayMs: 4800, label: 'Teko sleeping' },
};

const INK = '#2a3436';
const BODY = '#9fe0cf';
const BODY_SHADE = '#86d2bf';
const HEART = 'M0 7 C-14 -2 -10 -13 -3 -11 C-1.5 -10.5 0 -8.5 0 -7 C0 -8.5 1.5 -10.5 3 -11 C10 -13 14 -2 0 7 Z';
const STAR = 'M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z';
const DROP = 'M0 -9 C5 -2 7 2 7 5 A7 7 0 0 1 -7 5 C-7 2 -5 -2 0 -9 Z';

type Props = {
  mood?: TekoMood;
  size?: number;
  /** Naik-turun pelan (kelas `bob` di desain). Mati otomatis kalau "kurangi gerakan" aktif. */
  bob?: boolean;
};

export function Teko({ mood = 'idle', size = 160, bob = true }: Props) {
  const pose = POSES[mood];
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    if (bob) {
      lift.value = withRepeat(
        withSequence(
          withTiming(-size * 0.04, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    }
    if (pose.sway > 0) {
      tilt.value = -pose.sway;
      tilt.value = withRepeat(withTiming(pose.sway, { duration: pose.swayMs / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
  }, [bob, lift, pose.sway, pose.swayMs, reduceMotion, size, tilt]);

  const animated = useAnimatedStyle(() => ({
    // Goyang berporos di kaki Teko (bawah tengah), seperti rotate(… 100 176) di desain.
    transformOrigin: ['50%', '88%', 0],
    transform: [{ translateY: lift.value }, { rotate: `${tilt.value}deg` }],
  }));

  if (mood === 'pour' && !reduceMotion) {
    return (
      <Animated.View style={[{ width: size, height: size }, animated]} accessible accessibilityRole="image" accessibilityLabel={pose.label}>
        <PourScene size={size} pose={pose} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ width: size, height: size }, animated]} accessible accessibilityRole="image" accessibilityLabel={pose.label}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {pose.fx !== 'pour' && <Ellipse cx={100} cy={186} rx={54} ry={7} fill="#1d2426" opacity={0.08} />}
        {pose.fx === 'pour' && <Glasses />}
        <G transform={pose.body}>
          <Character pose={pose} />
        </G>
        <Effects fx={pose.fx} />
      </Svg>
    </Animated.View>
  );
}

function Character({ pose }: { pose: Pose }) {
  return (
    <G>
      {pose.fx === 'steam' && (
        <G>
          <Path d="M24 66 q-7 -8 0 -16 q7 -8 0 -16" fill="none" stroke="#8fcfbe" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
          <Path d="M38 60 q-5 -6 0 -12 q5 -6 0 -12" fill="none" stroke="#8fcfbe" strokeWidth={3.5} strokeLinecap="round" opacity={0.5} />
        </G>
      )}
      {/* corong */}
      <Path d="M56 118 Q30 114 25 88" fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" />
      <Path d="M56 118 Q30 114 25 88" fill="none" stroke={BODY} strokeWidth={15} strokeLinecap="round" />
      {/* pegangan */}
      <Path d="M146 104 C180 98 182 152 146 152" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <Path d="M146 104 C180 98 182 152 146 152" fill="none" stroke={BODY} strokeWidth={5} strokeLinecap="round" />
      {/* kaki */}
      <Ellipse cx={76} cy={174} rx={13} ry={8} fill={BODY_SHADE} stroke={INK} strokeWidth={4} />
      <Ellipse cx={124} cy={174} rx={13} ry={8} fill={BODY_SHADE} stroke={INK} strokeWidth={4} />
      {/* badan */}
      <Path
        d="M42 134 C42 94 68 80 100 80 C132 80 158 94 158 134 C158 166 134 178 100 178 C66 178 42 166 42 134 Z"
        fill={BODY}
        stroke={INK}
        strokeWidth={4.5}
      />
      <Ellipse cx={100} cy={162} rx={34} ry={11} fill="#c9f0e4" />
      <Path d="M56 114 Q60 98 74 91" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.75} />
      {pose.open && <Ellipse cx={100} cy={84} rx={30} ry={6.5} fill="#2f4a46" />}
      {pose.fx === 'fill' && (
        <G>
          <G transform="translate(0 6)">
            <Circle cx={100} cy={36} r={11} fill="#ffd66b" stroke={INK} strokeWidth={3.5} />
            <Path d="M100 30 v12 M96.5 33.5 h7" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          </G>
          <Circle cx={94} cy={4} r={9} fill="#ffd66b" stroke={INK} strokeWidth={3.5} />
        </G>
      )}
      {/* tutup */}
      <G transform={pose.lid}>
        <Path d="M68 86 C68 66 132 66 132 86 Z" fill={BODY} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <Rect x={62} y={82} width={76} height={9} rx={4.5} fill={BODY_SHADE} stroke={INK} strokeWidth={4.5} />
        <Circle cx={100} cy={62} r={9} fill="#ff9a62" stroke={INK} strokeWidth={4} />
        <Circle cx={97} cy={59} r={2.5} fill="#ffffff" />
      </G>
      {pose.brows && (
        <G>
          <Path d="M71 116 L87 110" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M113 110 L129 116" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </G>
      )}
      <Eyes kind={pose.eyes} />
      <Ellipse cx={64} cy={142} rx={9} ry={5.5} fill="#ffb3a1" opacity={pose.blush ? 1 : 0.85} />
      <Ellipse cx={136} cy={142} rx={9} ry={5.5} fill="#ffb3a1" opacity={pose.blush ? 1 : 0.85} />
      <Mouth kind={pose.mouth} />
      {pose.fx === 'tear' && <Path d="M0 -7 C4 -1 5 2 5 4 A5 5 0 0 1 -5 4 C-5 2 -4 -1 0 -7 Z" transform="translate(73 148)" fill="#bfe3ff" stroke={INK} strokeWidth={2.5} />}
    </G>
  );
}

function Eyes({ kind }: { kind: EyeKind }) {
  switch (kind) {
    case 'open':
      return (
        <G>
          <Ellipse cx={80} cy={128} rx={7} ry={8.5} fill={INK} />
          <Ellipse cx={120} cy={128} rx={7} ry={8.5} fill={INK} />
          <Circle cx={82.5} cy={124.5} r={2.6} fill="#ffffff" />
          <Circle cx={78} cy={131} r={1.2} fill="#ffffff" />
          <Circle cx={122.5} cy={124.5} r={2.6} fill="#ffffff" />
          <Circle cx={118} cy={131} r={1.2} fill="#ffffff" />
        </G>
      );
    case 'look':
      return (
        <G>
          <Ellipse cx={84} cy={124} rx={6.5} ry={7.5} fill={INK} />
          <Ellipse cx={124} cy={124} rx={6.5} ry={7.5} fill={INK} />
          <Circle cx={86.5} cy={121} r={2.4} fill="#ffffff" />
          <Circle cx={126.5} cy={121} r={2.4} fill="#ffffff" />
        </G>
      );
    case 'happy':
      return (
        <G>
          <Path d="M72 131 Q80 120 88 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <Path d="M112 131 Q120 120 128 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
        </G>
      );
    case 'wink':
      return (
        <G>
          <Path d="M72 131 Q80 120 88 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <Ellipse cx={120} cy={128} rx={7} ry={8.5} fill={INK} />
          <Circle cx={122.5} cy={124.5} r={2.6} fill="#ffffff" />
          <Circle cx={118} cy={131} r={1.2} fill="#ffffff" />
        </G>
      );
    case 'sleep':
      return (
        <G>
          <Path d="M72 129 Q80 135 88 129" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M112 129 Q120 135 128 129" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </G>
      );
    case 'heart':
      return (
        <G>
          <Path d={HEART} transform="translate(80 128)" fill="#ff7a85" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d={HEART} transform="translate(120 128)" fill="#ff7a85" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </G>
      );
  }
}

function Mouth({ kind }: { kind: MouthKind }) {
  const line = { fill: 'none', stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  switch (kind) {
    case 'cat':
      return <Path d="M93 140 Q96.5 145 100 140 Q103.5 145 107 140" {...line} />;
    case 'open':
      return (
        <G>
          <Path d="M90 139 Q100 156 110 139 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={100} cy={144.5} rx={5} ry={2.6} fill="#ff8f7a" />
        </G>
      );
    case 'o':
      return <Ellipse cx={100} cy={144} rx={4.5} ry={5.5} fill={INK} />;
    case 'tongue':
      return (
        <G>
          <Path d="M101 142 q0 9 5 9 q5 0 5 -9 Z" fill="#ff8f7a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M90 140 Q100 148 112 139" {...line} />
        </G>
      );
    case 'wavy':
      return <Path d="M89 144 q3.5 -4 7 0 q3.5 4 7 0 q3.5 -4 7 0" {...line} />;
    case 'frown':
      return <Path d="M92 147 Q100 138 108 147" {...line} />;
    case 'hmm':
      return <Path d="M95 144 L107 141" {...line} />;
    case 'snore':
      return <Ellipse cx={100} cy={144} rx={3} ry={3.5} fill={INK} />;
  }
}

function Effects({ fx }: { fx: Fx }) {
  switch (fx) {
    case 'sweat':
      return <Path d={DROP} transform="translate(154 96)" fill="#bfe3ff" stroke={INK} strokeWidth={3} />;
    case 'zzz':
      return (
        <G fill="none" stroke="#6f8fcf" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M150 70 h10 l-10 10 h10" opacity={0.5} />
          <Path d="M164 50 h13 l-13 13 h13" opacity={0.8} />
          <Path d="M178 24 h15 l-15 15 h15" />
        </G>
      );
    case 'think':
      return (
        <G>
          <Circle cx={150} cy={84} r={4} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
          <Circle cx={160} cy={68} r={6} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
          <Rect x={148} y={22} width={48} height={32} rx={16} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <Circle cx={161} cy={38} r={3.5} fill={INK} opacity={0.3} />
          <Circle cx={172} cy={38} r={3.5} fill={INK} opacity={0.65} />
          <Circle cx={183} cy={38} r={3.5} fill={INK} />
        </G>
      );
    case 'hearts':
      return (
        <G>
          <Path d={HEART} transform="translate(168 62)" fill="#ff9aa3" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d={HEART} transform="translate(30 70)" fill="#ffb3a1" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </G>
      );
    case 'spark':
      return (
        <G>
          <Path d={STAR} transform="translate(34 52)" fill="#ff9a62" />
          <Path d={STAR} transform="translate(168 48) scale(0.8)" fill="#ffd66b" />
          <Path d={STAR} transform="translate(178 128) scale(0.6)" fill="#b9aef5" />
          <Path d={STAR} transform="translate(20 124) scale(0.6)" fill="#ffd66b" />
        </G>
      );
    default:
      return null;
  }
}

// --- Animasi "pour" (F01 Welcome) -------------------------------------------------------------
// Timeline 7 detik diambil dari keyframe SMIL di Teko.dc.html: Teko pindah ke tiap gelas, miring,
// aliran turun, gelas terisi bergantian, lalu semua kosong dan Teko kembali ke gelas pertama.

const POUR_MS = 7000;
const GLASS_X = [34, 70, 106] as const;
const GLASS_TINT = ['#ffdccb', '#cdeedd', '#d6e4ff'] as const;
/** Jendela isi tiap gelas: mulai isi, penuh (keyTimes rect height di desain). */
const FILL = [
  [0.07, 0.2],
  [0.4, 0.53],
  [0.73, 0.86],
] as const;
/** Jendela aliran terlihat (stroke-dashoffset di desain). */
const STREAM = [
  [0.08, 0.19],
  [0.41, 0.52],
  [0.74, 0.85],
] as const;
const MOVE_T = [0, 0.26, 0.295, 0.33, 0.59, 0.625, 0.66, 0.92, 0.96, 1];
const MOVE_X = [18.5, 18.5, 36.5, 54.5, 54.5, 72.5, 90.5, 90.5, 54.5, 18.5];
const MOVE_Y = [30, 30, 18, 30, 30, 18, 30, 30, 8, 30];
const TILT_T = [0, 0.05, 0.22, 0.26, 0.295, 0.33, 0.38, 0.55, 0.59, 0.625, 0.66, 0.71, 0.88, 0.92, 0.96, 1];
const TILT = [-6, -32, -32, -6, 4, -6, -32, -32, -6, 4, -6, -32, -32, -6, 6, -6];

function PourScene({ size, pose }: { size: number; pose: Pose }) {
  const k = size / 200;
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: POUR_MS, easing: Easing.linear }), -1);
  }, [t]);

  // Poros putar = ujung corong setelah scale(0.62): titik (15.5, 54.6) di viewBox.
  const tekoStyle = useAnimatedStyle(() => ({
    transformOrigin: [15.5 * k, 54.6 * k, 0],
    transform: [
      { translateX: interpolate(t.value, MOVE_T, MOVE_X) * k },
      { translateY: interpolate(t.value, MOVE_T, MOVE_Y) * k },
      { rotate: `${interpolate(t.value, TILT_T, TILT)}deg` },
    ],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* lapisan 1: warna gelas */}
      <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        {GLASS_X.map((x, i) => (
          <Path key={x} d={glassPath(x)} fill={GLASS_TINT[i]} />
        ))}
      </Svg>
      {/* lapisan 2: isi gelas + aliran teh */}
      {GLASS_X.map((x, i) => (
        <PourLayer key={x} t={t} k={k} x={x} fill={FILL[i]} stream={STREAM[i]} />
      ))}
      {/* lapisan 3: garis gelas di atas isinya */}
      <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        {GLASS_X.map((x) => (
          <G key={x}>
            <Path d={glassPath(x)} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
            <Path d={`M${x - 8} 152 L${x - 7} 172`} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
          </G>
        ))}
      </Svg>
      {/* lapisan 4: Teko */}
      <Animated.View style={[StyleSheet.absoluteFill, tekoStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <G transform="scale(0.62)">
            <Character pose={pose} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

function PourLayer({
  t,
  k,
  x,
  fill,
  stream,
}: {
  t: SharedValue<number>;
  k: number;
  x: number;
  fill: readonly [number, number];
  stream: readonly [number, number];
}) {
  const liquid = useAnimatedStyle(() => {
    const h = interpolate(t.value, [0, fill[0], fill[1], 0.94, 0.99, 1], [0, 0, 24, 24, 0, 0], Extrapolation.CLAMP) * k;
    return { top: 178 * k - h, height: h };
  });
  const flow = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [stream[0] - 0.015, stream[0], stream[1], stream[1] + 0.015], [0, 1, 1, 0], Extrapolation.CLAMP),
  }));
  const spark = useAnimatedStyle(() => {
    const o = interpolate(t.value, [fill[1], fill[1] + 0.03, fill[1] + 0.1], [0, 1, 0], Extrapolation.CLAMP);
    return { opacity: o, transform: [{ scale: 0.6 + o * 0.4 }] };
  });

  return (
    <>
      <Animated.View style={[{ position: 'absolute', left: (x - 10.5) * k, width: 21 * k, backgroundColor: '#ffc56b' }, liquid]} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: (x - 4.5) * k,
            top: 86 * k,
            width: 9 * k,
            height: 64 * k,
            borderRadius: 4.5 * k,
            backgroundColor: INK,
            alignItems: 'center',
            paddingVertical: 2 * k,
          },
          flow,
        ]}>
        <View style={{ flex: 1, width: 5 * k, borderRadius: 2.5 * k, backgroundColor: '#ffc56b' }} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: (x + 12 - 8) * k, top: (138 - 8) * k }, spark]}>
        <Svg width={16 * k} height={16 * k} viewBox="-8 -8 16 16">
          <Path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#ffd66b" stroke={INK} strokeWidth={1.5} />
        </Svg>
      </Animated.View>
    </>
  );
}

function glassPath(x: number) {
  return `M${x - 13} 146 L${x + 13} 146 L${x + 11} 180 Q${x} 183 ${x - 11} 180 Z`;
}

/** Frame diam pose "pour" (dipakai saat "kurangi gerakan" aktif): gelas pertama penuh, tengah dituang. */
function Glasses() {
  const glass = (x: number, tint: string, level: number) => (
    <G key={x}>
      <Path d={`M${x - 13} 146 L${x + 13} 146 L${x + 11} 180 Q${x} 183 ${x - 11} 180 Z`} fill={tint} />
      {level > 0 && <Rect x={x - 10.5} y={178 - level} width={21} height={level} fill="#ffc56b" />}
      <Path
        d={`M${x - 13} 146 L${x + 13} 146 L${x + 11} 180 Q${x} 183 ${x - 11} 180 Z`}
        fill="none"
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Path d={`M${x - 8} 152 L${x - 7} 172`} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
    </G>
  );

  return (
    <G>
      {glass(34, '#ffdccb', 24)}
      {glass(70, '#cdeedd', 12)}
      {glass(106, '#d6e4ff', 0)}
      {/* aliran dari corong ke gelas tengah */}
      <Path d="M70 88 L70 164" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <Path d="M70 88 L70 164" stroke="#ffc56b" strokeWidth={5} strokeLinecap="round" />
      <Circle cx={63} cy={140} r={2.2} fill="#ffc56b" stroke={INK} strokeWidth={1.4} />
      <Circle cx={77} cy={142} r={1.8} fill="#ffc56b" stroke={INK} strokeWidth={1.4} />
    </G>
  );
}

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bob, Coin, Sparkle } from '@/components/decor';
import { Logo } from '@/components/logo';
import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import { flagKeys, getFlag, setFlag } from '@/lib/device-flags';

// Chip negara dan cerita Rina/Wei/Jack adalah ilustrasi pemasaran dari desain, bukan data user.
const members = {
  rina: { name: 'Rina', tint: palette.apricot },
  wei: { name: 'Wei', tint: palette.greenSoft },
  jack: { name: 'Jack', tint: palette.sky },
};

const SLIDES: { title: string; body: string; art: () => ReactNode }[] = [
  {
    title: 'One pot for the whole trip.',
    body: 'Friends from any country chip in, spend together, and Teko settles everyone up on the last day.',
    art: () => <WelcomeArt />,
  },
  {
    title: 'Chip in, then anyone can pay.',
    body: "Everyone adds dollars to one pot. Any member can pay from it. Big spends need a friend's OK first.",
    art: () => <PotArt />,
  },
  {
    title: 'Teko settles up on the last day.',
    body: 'When the trip ends, Teko works out who owes whom and sends everyone their share back. No spreadsheets.',
    art: () => <SettleArt />,
  },
];

/**
 * 01 Welcome + onboarding O1–O3. O1 = canvas "Final UI" › F01Welcome; O2–O3 memakai pola kartu yang sama.
 * Hanya tampil sekali per perangkat; sesudahnya langsung ke 02 Sign in (O4). `?intro=1` memutar ulang.
 */
export default function WelcomeScreen() {
  const { intro } = useLocalSearchParams<{ intro?: string }>();
  const [seen, setSeen] = useState<boolean | null>(intro ? false : null);

  useEffect(() => {
    if (intro) return;
    getFlag(flagKeys.onboardingSeen).then(setSeen);
  }, [intro]);

  if (seen === null) return <View style={styles.container} />;
  if (seen) return <Redirect href="/sign-in" />;
  return <Onboarding />;
}

function Onboarding() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const finish = () => {
    void setFlag(flagKeys.onboardingSeen);
    router.push('/sign-in');
  };

  const next = () => {
    if (last) return finish();
    scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.topRow, styles.pad]}>
        <Logo />
        {!last && (
          <Pressable accessibilityRole="button" onPress={finish} hitSlop={12}>
            <Text variant="label" color={colors.textMuted}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.slide, styles.pad, { width }]} accessibilityElementsHidden={i !== page}>
            <View style={styles.stage}>{slide.art()}</View>
            <View style={styles.copy}>
              <Text variant="hero">{slide.title}</Text>
              <Text variant="body" color={colors.textMuted}>
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.actions, styles.pad]}>
        <Dots count={SLIDES.length} active={page} />
        <Button label={last ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots} accessibilityLabel={`Page ${active + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotOn]} />
      ))}
    </View>
  );
}

function WelcomeArt() {
  return (
    <>
      <View style={styles.halo} />
      <View style={styles.teko}>
        <Teko mood="pour" size={170} />
      </View>
      <Bob duration={3800} delay={500} style={{ position: 'absolute', left: 0, top: 18 }}>
        <CountryChip name={members.rina.name} tint={members.rina.tint} country="Indonesia" />
      </Bob>
      <Bob duration={4200} delay={1000} style={{ position: 'absolute', right: 0, top: 130 }}>
        <CountryChip name={members.wei.name} tint={members.wei.tint} country="Singapore" />
      </Bob>
      <Bob duration={3200} style={{ position: 'absolute', left: 14, top: 262 }}>
        <CountryChip name={members.jack.name} tint={members.jack.tint} country="Australia" />
      </Bob>
      <Coin size={28} style={{ right: 36, top: 24 }} />
      <Coin size={24} style={{ right: 60, top: 290 }} />
      <Sparkle size={24} style={{ left: 58, top: 118 }} />
      <Sparkle size={16} color={palette.lavender} style={{ right: 30, top: 80 }} delay={800} />
    </>
  );
}

function PotArt() {
  return (
    <View style={styles.artColumn}>
      <View style={styles.potCard}>
        <View style={styles.potDeco} />
        <Text variant="caption" color={colors.heroText}>
          In the pot
        </Text>
        <Text variant="amountXL">$300.00</Text>
        <View style={{ gap: 8, marginTop: 4 }}>
          {Object.values(members).map((m) => (
            <View key={m.name} style={styles.personRow}>
              <Avatar name={m.name} tint={m.tint} size={28} />
              <Text style={styles.personName}>{m.name} chipped in</Text>
              <Text variant="label" color={colors.positive}>
                +$100
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Bob duration={3600} style={styles.spendCard}>
        <Text variant="label">Ramen in Shibuya · $42</Text>
        <Text variant="caption" color={colors.textMuted}>
          Paid by Wei from the pot
        </Text>
      </Bob>
      <View style={styles.cornerTeko}>
        <Teko mood="fill" size={84} />
      </View>
    </View>
  );
}

function SettleArt() {
  const rows = [
    { ...members.jack, amount: '+$38.20' },
    { ...members.rina, amount: '+$21.50' },
    { ...members.wei, amount: '+$12.40' },
  ];
  return (
    <View style={styles.artColumn}>
      <View style={styles.settleCard}>
        <Text variant="caption" color={colors.textMuted}>
          Last day · Teko settles up
        </Text>
        {rows.map((r) => (
          <View key={r.name} style={styles.personRow}>
            <Avatar name={r.name} tint={r.tint} size={28} />
            <Text style={styles.personName}>{r.name} gets back</Text>
            <Text variant="label" color={colors.positive}>
              {r.amount}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.cornerTeko}>
        <Teko mood="cheer" size={110} />
      </View>
      <Sparkle size={22} style={{ left: 12, bottom: 40 }} />
      <Coin size={26} style={{ left: 70, bottom: 6 }} />
    </View>
  );
}

function CountryChip({ name, tint, country, style }: { name: string; tint: string; country: string; style?: ViewStyle }) {
  return (
    <View style={[styles.chip, style]}>
      <Avatar name={name} tint={tint} />
      <Text variant="label" style={{ fontSize: 13 }}>
        {country}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    backgroundColor: colors.background,
  },
  pad: {
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slide: {
    gap: 20,
  },
  stage: {
    flex: 1,
    minHeight: 320,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    top: 40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.hero,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 70,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    boxShadow: '0 8px 20px rgba(29, 36, 38, 0.08)',
  },
  artColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  potCard: {
    overflow: 'hidden',
    padding: 20,
    gap: 2,
    borderRadius: radius.hero,
    backgroundColor: colors.hero,
  },
  potDeco: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.heroDeco,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personName: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  spendCard: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.row,
    backgroundColor: colors.warmBg,
    boxShadow: '0 8px 20px rgba(29, 36, 38, 0.08)',
  },
  settleCard: {
    padding: 20,
    gap: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    boxShadow: '0 10px 24px rgba(31, 122, 110, 0.10)',
  },
  cornerTeko: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  copy: {
    gap: 10,
  },
  actions: {
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotOn: {
    width: 22,
    backgroundColor: colors.primary,
  },
});

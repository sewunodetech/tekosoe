import { Link } from 'expo-router';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bob, Coin, Sparkle } from '@/components/decor';
import { Logo } from '@/components/logo';
import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, palette, radius } from '@/constants/theme';

// Chip negara di Welcome adalah ilustrasi pemasaran dari desain, bukan data user.
const members = {
  rina: { name: 'Rina', tint: palette.apricot },
  wei: { name: 'Wei', tint: palette.greenSoft },
  jack: { name: 'Jack', tint: palette.sky },
};

// 01 Welcome — canvas "Final UI" › F01Welcome
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 32 }]}>
      <Logo />

      <View style={styles.stage}>
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
      </View>

      <View style={styles.copy}>
        <Text variant="hero">One pot for the whole trip.</Text>
        <Text variant="body" color={colors.textMuted}>
          Friends from any country chip in, spend together, and Teko settles everyone up on the last day.
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/sign-in" asChild>
          <Button label="Get started" />
        </Link>
        <Link href="/sign-in" asChild>
          <Button label="I already have an account" variant="ghost" />
        </Link>
      </View>
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
    paddingHorizontal: 24,
    gap: 20,
    backgroundColor: colors.background,
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
  copy: {
    gap: 10,
  },
  actions: {
    gap: 8,
  },
});

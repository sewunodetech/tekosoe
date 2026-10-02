import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, screenPadding } from '@/constants/theme';
import { Avatar } from './avatar';
import { Text } from './text';

type ScreenProps = {
  children: ReactNode;
  /** Tombol/aksi yang menempel di bawah layar (setelah spacer `flex-grow` di desain). */
  footer?: ReactNode;
  gap?: number;
  /** Latar di belakang konten (mis. confetti). */
  background?: ReactNode;
  /** Tab screen tidak butuh padding bawah ekstra. */
  tab?: boolean;
  scroll?: boolean;
};

/** Kerangka layar: latar ivory, padding 20, konten bisa di-scroll, footer di bawah. */
export function Screen({ children, footer, gap = 16, background, tab = false, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <>
      <View style={{ gap }}>{children}</View>
      <View style={{ flexGrow: 1, minHeight: footer ? 16 : 0 }} />
      {footer ? <View style={{ gap: 8 }}>{footer}</View> : null}
    </>
  );
  const padding = {
    paddingTop: insets.top + 16,
    paddingBottom: tab ? 24 : insets.bottom + 28,
    paddingHorizontal: screenPadding,
  };

  return (
    <View style={styles.screen}>
      {background}
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.grow, padding]} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.grow, padding]}>{content}</View>
      )}
    </View>
  );
}

/** Kartu putih (atau berwarna) dengan sudut 22. */
export function Surface({ children, style, tone = colors.surface, padded = true }: { children: ReactNode; style?: ViewStyle; tone?: string; padded?: boolean }) {
  return <View style={[styles.surface, { backgroundColor: tone }, padded && styles.surfacePad, style]}>{children}</View>;
}

/** Label kecil berbentuk pil ("6 days left", "Simulated", status invoice). */
export function Pill({ label, bg = colors.surface, color = colors.text, weight = 'extraBold' }: { label: string; bg?: string; color?: string; weight?: 'bold' | 'extraBold' }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={{ fontFamily: weight === 'bold' ? fonts.bodyBold : fonts.bodyExtraBold, fontSize: 12 }} color={color}>
        {label}
      </Text>
    </View>
  );
}

/** Baris label — nilai ("Your share … $50.00"). */
export function KeyValue({ label, value, valueColor = colors.text, strong = false }: { label: string; value: ReactNode; valueColor?: string; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={{ fontFamily: strong ? fonts.bodyExtraBold : fonts.body, fontSize: 14 }} color={strong ? colors.text : colors.textMuted}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }} color={valueColor}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

/** Kotak info mint ("One yes from Rina or Wei is enough…"). */
export function InfoBox({ children, icon, tone = colors.infoBg }: { children: ReactNode; icon?: ReactNode; tone?: string }) {
  return (
    <View style={[styles.info, { backgroundColor: tone }]}>
      {icon}
      <Text style={{ flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19 }} color={colors.infoText}>
        {children}
      </Text>
    </View>
  );
}

/** Judul bagian kecil ("Activity", "If we settled today"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14, paddingHorizontal: 4 }}>
      {children}
    </Text>
  );
}

/** Tumpukan avatar yang saling menimpa. */
export function AvatarStack({
  people,
  size = 28,
  ring = colors.hero,
  extra,
}: {
  people: { name: string; tint: string }[];
  size?: number;
  ring?: string;
  extra?: number;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {people.map((p, i) => (
        <View key={p.name + i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={p.name} size={size} tint={p.tint} borderColor={ring} />
        </View>
      ))}
      {extra ? (
        <View style={[styles.extra, { width: size, height: size, borderRadius: size / 2, borderColor: ring }]}>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 12 }} color={colors.textMuted}>
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grow: {
    flexGrow: 1,
  },
  surface: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  surfacePad: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.row,
  },
  extra: {
    marginLeft: -8,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

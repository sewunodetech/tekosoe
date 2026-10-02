import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, palette, radius } from '@/constants/theme';
import type { FeedItem, FeedKind } from '@/data/types';
import { money, signed } from '@/lib/money';
import { Avatar } from './ui/avatar';
import { Icon, type IconName } from './ui/icon';
import { Text } from './ui/text';

/** Ikon + warna ubin per jenis kejadian (gaya ubin ikon sama dengan `ActivityRow` di layar Trip). */
const LOOK: Record<FeedKind, { icon: IconName; tile: string; color?: string }> = {
  topUp: { icon: 'plus', tile: colors.positiveBg, color: colors.positiveText },
  cashOut: { icon: 'external', tile: colors.surfaceMuted },
  tripStarted: { icon: 'home', tile: colors.hero, color: colors.primary },
  joined: { icon: 'profile', tile: colors.hero, color: colors.primary },
  deposit: { icon: 'plus', tile: colors.hero, color: colors.primary },
  spendRequested: { icon: 'shield', tile: palette.peach, color: colors.notice },
  spend: { icon: 'pay', tile: palette.cream },
  declined: { icon: 'close', tile: colors.sadBg, color: colors.sleepText },
  disputed: { icon: 'close', tile: colors.sadBg, color: colors.sleepText },
  receipt: { icon: 'receipt', tile: palette.cream, color: colors.primary },
  settled: { icon: 'check', tile: colors.hero, color: colors.primary },
  safetyNet: { icon: 'shield', tile: palette.cream, color: colors.notice },
  refund: { icon: 'check', tile: colors.positiveBg, color: colors.positiveText },
  debtPaid: { icon: 'card', tile: palette.cream },
};

/** Satu baris di layar Activity: avatar orang lain atau ubin ikon, judul, keterangan, nominal, jam. */
export function FeedRow({ item, time }: { item: FeedItem; time: string }) {
  const look = LOOK[item.kind];
  const body = (
    <>
      {item.actor ? (
        <Avatar name={item.actor.name} tint={item.actor.tint} size={40} />
      ) : (
        <View style={[styles.iconTile, { backgroundColor: look.tile }]}>
          <Icon name={look.icon} size={19} color={look.color ?? colors.text} strokeWidth={2.2} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }} numberOfLines={2}>
          {item.sub}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        {item.amount !== undefined ? (
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }} color={item.amount > 0n ? colors.positive : colors.text}>
            {signed(item.amount)}
          </Text>
        ) : item.neutralAmount !== undefined ? (
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>{money(item.neutralAmount)}</Text>
        ) : null}
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12 }} color={colors.textMuted}>
          {time}
        </Text>
      </View>
    </>
  );

  if (!item.href) return <View style={styles.row}>{body}</View>;
  return (
    <Link href={item.href as Href} asChild>
      <Pressable accessibilityRole="link" style={styles.row}>
        {body}
      </Pressable>
    </Link>
  );
}

/** Kartu "Needs you": permintaan bayar yang menunggu persetujuanmu (ke layar 10 Approval). */
export function NeedsYouRow({ item }: { item: FeedItem }) {
  return (
    <Link href={(item.href ?? '/') as Href} asChild>
      <Pressable accessibilityRole="link" style={styles.needsYou}>
        {item.actor ? (
          <Avatar name={item.actor.name} tint={item.actor.tint} size={40} />
        ) : (
          <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
            <Icon name="shield" size={19} color={colors.notice} strokeWidth={2.2} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>
            {item.title} {item.neutralAmount !== undefined ? money(item.neutralAmount) : ''}
          </Text>
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }} numberOfLines={2}>
            {item.sub}
          </Text>
        </View>
        <View style={styles.reviewPill}>
          <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 12 }} color={colors.textOnPrimary}>
            Review
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needsYou: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.row,
    backgroundColor: colors.warmBg,
    borderWidth: 1.5,
    borderColor: palette.peachSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});

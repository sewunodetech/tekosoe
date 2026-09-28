import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Member, Spend } from '@/data/types';
import { money, signed } from '@/lib/money';
import { PulseDot } from './decor';
import { Avatar } from './ui/avatar';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

/** Baris aktivitas di layar Trip (F07): ikon, judul, siapa/untuk siapa, nominal, tanda struk. */
export function ActivityRow({ spend, href, fresh = false, meta }: { spend: Spend; href?: Href; fresh?: boolean; meta?: string }) {
  const body = (
    <>
      <View style={styles.iconTile}>
        <Icon name={spend.icon} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{spend.title}</Text>
        <View style={styles.metaRow}>
          {fresh && <PulseDot />}
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
            {meta ?? `${spend.paidBy.name} · ${spend.forWhom}`}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>{money(spend.amount)}</Text>
        {spend.hasReceipt ? (
          <View style={styles.metaRow}>
            <Icon name="receipt" size={12} color={colors.primary} strokeWidth={2.4} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11 }} color={colors.primary}>
              Receipt
            </Text>
          </View>
        ) : (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11 }} color={colors.warning}>
            No receipt
          </Text>
        )}
      </View>
    </>
  );

  if (!href) return <View style={styles.row}>{body}</View>;
  return (
    <Link href={href} asChild>
      <Pressable style={styles.row}>{body}</Pressable>
    </Link>
  );
}

/** Baris anggota + nominal ("If we settled today", split, settle-up). */
export function MemberAmountRow({
  member,
  amount,
  sub,
  size = 26,
  positive,
  showSign = true,
}: {
  member: Member;
  amount: bigint;
  sub?: string;
  size?: number;
  positive?: boolean;
  showSign?: boolean;
}) {
  const isPositive = positive ?? amount > 0n;
  return (
    <View style={styles.memberRow}>
      <Avatar name={member.name} tint={member.tint} size={size} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: sub ? fonts.bodyBold : fonts.body, fontSize: 14 }}>{member.label}</Text>
        {sub ? (
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }} color={isPositive && showSign ? colors.positive : colors.text}>
        {showSign ? signed(amount) : money(amount)}
      </Text>
    </View>
  );
}

/** Baris orang dengan kota (Invite, Trip members). */
export function PersonRow({ member, badge }: { member: Member; badge?: string }) {
  return (
    <View style={styles.personRow}>
      <Avatar name={member.name} tint={member.tint} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }}>{member.label}</Text>
        <Text variant="caption" color={colors.textMuted}>
          {member.city}
        </Text>
      </View>
      {badge ? (
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12 }} color={colors.primary}>
          {badge}
        </Text>
      ) : null}
    </View>
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
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
});

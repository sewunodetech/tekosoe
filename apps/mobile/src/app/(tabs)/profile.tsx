import { Link } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { BalanceCard } from '@/components/balance-card';
import { combine, QueryState } from '@/components/query-state';
import { Teko } from '@/components/teko';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Profile } from '@/data/types';
import { useProfile } from '@/features/profile/useProfile';
import { useTrips } from '@/features/trips/useTrips';
import { useSession } from '@/providers/session-provider';
import { useNotifications } from '@/providers/notification-provider';

// P2 Profile — canvas "Final UI" › P02Profile. Tab ketiga.
// TODO (M11): toggle notifikasi → expo-notifications + api → push_subs. "Past trips" & "Help" → layar sendiri.
export default function ProfileScreen() {
  const query = combine(useProfile(), useTrips());
  return (
    <QueryState query={query} tab headerAction="none">
      {([profile, trips]) => (
        <ProfileView profile={profile} activeTrips={trips.list.length} settled={trips.settled} />
      )}
    </QueryState>
  );
}

function ProfileView({
  profile,
  activeTrips,
  settled,
}: {
  profile: Profile | null;
  activeTrips: number;
  settled: { name: string; returnAmount: string }[];
}) {
  const { signOut } = useSession();
  const { enabled: notifEnabled, toggleNotifications } = useNotifications();
  const name = profile?.name ?? 'You';

  return (
    <Screen tab gap={16}>
      <View style={styles.header}>
        <Text variant="h2">Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardDeco} />
        <View style={[styles.avatar, { backgroundColor: profile?.tint ?? palette.sky }]}>
          <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 32 }}>{name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }}>
            {name}
          </Text>
          <Text variant="caption" style={{ fontFamily: fonts.bodySemiBold }} color={colors.heroText}>
            {profile ? `${profile.city}, ${profile.country}` : 'Add your city'}
          </Text>
        </View>
        <Link href={{ pathname: '/setup-profile', params: { mode: 'edit' } }} asChild>
          <Pressable accessibilityRole="button" style={styles.editPill}>
            <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13 }}>Edit</Text>
          </Pressable>
        </Link>
      </View>

      <BalanceCard />

      <View style={styles.stats}>
        <Stat label="Active trips" value={String(activeTrips)} />
        <Stat label="Settled" value={String(settled.length)} />
        <Stat label="Got back" value={settled[0]?.returnAmount ?? '$0.00'} positive />
      </View>

      <View style={styles.faceRow}>
        <View style={[styles.iconTile, { width: 44, height: 44, backgroundColor: colors.hero }]}>
          <Icon name="faceId" size={22} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }}>Signed in with Passkey</Text>
          <Text variant="caption" color={colors.textMuted}>
            Your account lives on this phone. Same passkey opens it on a new phone.
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        <Row icon="bell" tint={palette.cream} title="Notifications" sub="Approvals, new payments, invoices">
          <Switch
            value={notifEnabled}
            onValueChange={toggleNotifications}
            accessibilityLabel="Notifications"
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
            thumbColor={colors.surface}
          />
        </Row>
        <Row icon="home" tint={palette.sky} title="Past trips" sub={settled.map((s) => `${s.name} · settled`).join(', ') || 'None yet'} chevron />
        <Row glyph="?" tint={palette.greenSoft} title="Help and feedback" sub="How the pot and settle-up work" chevron last />
      </View>

      <View style={styles.footer}>
        <Teko mood="idle" size={48} />
        <Text variant="small" style={{ flex: 1, fontFamily: fonts.body, lineHeight: 17 }} color={colors.textMuted}>
          Tekosoe v0.1 · made for friends who travel together
        </Text>
        <Pressable accessibilityRole="button" onPress={() => signOut()} style={styles.signOut}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13 }}>Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Stat({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text variant="small" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
        {label}
      </Text>
      <Text variant="h3" style={{ fontSize: 22, lineHeight: 28 }} color={positive ? colors.positive : colors.text}>
        {value}
      </Text>
    </View>
  );
}

function Row({
  icon,
  glyph,
  tint,
  title,
  sub,
  chevron = false,
  last = false,
  children,
}: {
  icon?: IconName;
  glyph?: string;
  tint: string;
  title: string;
  sub: string;
  chevron?: boolean;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.iconTile, { backgroundColor: tint }]}>
        {icon ? <Icon name={icon} size={18} strokeWidth={2} /> : <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 15 }}>{glyph}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>{title}</Text>
        <Text variant="small" style={{ fontFamily: fonts.body }} color={colors.textMuted}>
          {sub}
        </Text>
      </View>
      {children}
      {chevron && <Icon name="chevron" size={16} color={colors.textMuted} strokeWidth={2} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    justifyContent: 'center',
  },
  card: {
    overflow: 'hidden',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: colors.hero,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardDeco: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.heroDeco,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
  faceRow: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  list: {
    paddingHorizontal: 18,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.sand,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  signOut: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
});

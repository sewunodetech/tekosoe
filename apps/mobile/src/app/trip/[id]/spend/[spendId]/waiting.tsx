import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PulseDot } from '@/components/decor';
import { Teko } from '@/components/teko';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen, Surface } from '@/components/ui/layout';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { combine, QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Spend, Trip } from '@/data/types';
import { useSpend } from '@/features/spends/useSpend';
import { useTrip } from '@/features/trips/useTrip';
import { money } from '@/lib/money';
import { useNotifications } from '@/providers/notification-provider';
import { isLive } from '@/lib/env';

// S2 Waiting for approval — canvas "Final UI" › S02Waiting
// TODO: Envio SpendRequested + api → spend_reviews (Seen). "Nudge" kirim push.
export default function WaitingForApprovalScreen() {
  const { id, spendId } = useLocalSearchParams<{ id: string; spendId: string }>();
  return (
    <QueryState query={combine(useTrip(id), useSpend(spendId, id))} title="Waiting for a yes">
      {([trip, spend]) => <WaitingView trip={trip} spend={spend} />}
    </QueryState>
  );
}

function WaitingView({ trip, spend }: { trip: Trip; spend: Spend }) {
  const { notify } = useNotifications();
  // Yang bisa menyetujui = anggota selain pembayar. Status "Seen" masih demo (TODO: spend_reviews).
  const others = trip.members.filter((m) => m.id !== spend.paidBy?.id);

  // Fallback jika trip hanya berisi 1 orang (demo/tester)
  const defaultMember1 = { id: 'dummy1', name: 'Friend', tint: palette.sky, label: 'Friend' } as any;

  const approvers = others.length > 0 ? others : [defaultMember1];
  const nudgeNames = approvers.map(a => a.name).slice(0, 2).join(' and ');

  return (
    <Screen
      footer={
        <>
          <Button
            label={`Nudge ${nudgeNames}`}
            onPress={() => {
              notify({
                title: `${spend.paidBy.name} nudged you`,
                body: `Please approve the payment for ${spend.title}.`,
                data: { url: `/trip/${trip.id}/spend/${spend.id}/approve` },
              });
            }}
          />
          <Link href={`/trip/${trip.id}`} asChild>
            <Button label="Cancel request" variant="ghost" />
          </Link>
        </>
      }>
      <ScreenHeader title="Waiting for a yes" />

      <View style={styles.center}>
        <View style={styles.halo}>
          <Teko mood="think" size={150} />
        </View>
        <Text variant="h1" style={styles.textCenter}>
          {money(spend.amount).replace('.00', '')} for {spend.title}
        </Text>
        <Text style={[styles.textCenter, { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }]} color={colors.textMuted}>
          The money stays in the pot until a friend says yes.
        </Text>
      </View>

      <Surface style={{ gap: 14 }}>
        <View style={styles.row}>
          <View style={[styles.round, { backgroundColor: colors.positiveBg }]}>
            <Icon name="check" size={16} color={colors.positive} strokeWidth={2.6} />
          </View>
          <Text style={styles.name}>You asked</Text>
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
            {isLive ? spend.when : 'Just now'}
          </Text>
        </View>

        {approvers.map((m, i) => (
          <View key={m.id} style={styles.row}>
            <Avatar name={m.name} tint={m.tint} size={32} />
            <Text style={styles.name}>{m.name}</Text>
            {i === 0 ? (
              <View style={styles.seen}>
                <PulseDot color={colors.accent} size={8} />
                <Text variant="small" color={palette.brownDeep}>
                  Seen
                </Text>
              </View>
            ) : (
              <Text variant="small" color={colors.textMuted}>
                Not yet
              </Text>
            )}
          </View>
        ))}

        <Text variant="caption" color={colors.textMuted}>
          One yes is enough. The request closes in 24 hours.
        </Text>
      </Surface>


    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 10,
  },
  halo: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.warmBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  seen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demo: {
    minHeight: 44,
    borderRadius: radius.input,
  },
});

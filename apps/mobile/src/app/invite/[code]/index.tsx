import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Bob, Sparkle } from '@/components/decor';
import { Logo } from '@/components/logo';
import { Teko } from '@/components/teko';
import { PersonRow } from '@/components/trip-rows';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InfoBox, Screen, Surface } from '@/components/ui/layout';
import { Text } from '@/components/ui/text';
import { QueryState } from '@/components/query-state';
import { colors, fonts, palette, radius } from '@/constants/theme';
import type { Trip } from '@/data/types';
import { useJoinTrip } from '@/features/trips/useJoinTrip';
import { useOutstandingDebt } from '@/features/trips/useOutstandingDebt';
import { DebtNotice } from '@/components/debt-notice';
import { useTrip } from '@/features/trips/useTrip';
import { useTripSafetyNet } from '@/features/trips/useTripSafetyNet';
import { tripIdFromInvite } from '@/lib/invite';
import { useNotifications } from '@/providers/notification-provider';
import { useSession } from '@/providers/session-provider';
import { TxOverlay } from '@/tx/tx-overlay';
import { useTx } from '@/tx/useTx';
import { money, moneyShort } from '@/lib/money';

// 05 Invite — canvas "Final UI" › F05Invite. Dibuka dari tekosue://invite/<code> atau tautan web.
// Live: kode = `<groupId>-<rahasia>`; trip dibaca dari Envio + profil dari api. Rahasia tetap di link.
// "Join with Passkey" langsung gabung (satu transaksi joinGroup, tanpa setoran/safety net — ADR 0009).
export default function InviteScreen() {
  const { code, join } = useLocalSearchParams<{ code: string; join?: string }>();
  return (
    <QueryState query={useTrip(tripIdFromInvite(code))}>
      {(trip) => <InviteView trip={trip} code={code} autoJoin={join === '1'} />}
    </QueryState>
  );
}

function InviteView({ trip, code, autoJoin }: { trip: Trip; code: string; autoJoin: boolean }) {
  const { signer } = useSession();
  const { notify } = useNotifications();
  const isMember = trip.members.some((m) => m.label === 'You');
  // Join = setuju dengan safety net trip; tombol menunggu angkanya supaya yang disetujui = yang dipakai.
  const safetyNet = useTripSafetyNet(trip.id).data;
  const joinTrip = useJoinTrip(code);
  // Masih berutang dari trip lain: kontrak menolak join (ADR 0013), jadi tahan tombolnya di sini.
  const debt = useOutstandingDebt().data;
  const owes = !isMember && (debt?.total ?? 0n) > 0n;
  const joinTx = useTx(joinTrip.mutateAsync, {
    onSuccess: () => {
      notify({ title: 'Joined trip', body: `You joined ${trip.name}.`, data: { url: `/trip/${trip.id}` } });
      router.replace('/trips');
    },
  });

  const join = () => {
    if (isMember) return router.replace(`/trip/${trip.id}`);
    if (joinTx.isProcessing) return;
    // Belum masuk: passkey dulu; gate di _layout kembali ke sini dengan ?join=1 dan gabung otomatis.
    if (!signer) return router.push({ pathname: '/sign-in', params: { next: `/invite/${code}?join=1` } });
    void joinTx.execute(undefined);
  };

  // Kembali dari sign in (user sudah menekan Join sebelumnya): gabung sekali, tanpa ketukan kedua.
  const autoJoined = useRef(false);
  useEffect(() => {
    if (!autoJoin || !signer || isMember || owes || safetyNet === undefined || autoJoined.current) return;
    autoJoined.current = true;
    void joinTx.execute(undefined);
  }, [autoJoin, signer, isMember, owes, safetyNet, joinTx]);
  // Anggota pertama = pembuat trip; yang ditampilkan hanya anggota lain (bukan "You").
  const organizer = trip.members[0];
  const others = trip.members.filter((m) => m.label !== 'You');

  return (
    <Screen
      gap={20}
      footer={
        <>
          <Button
            label={isMember ? 'Open trip' : 'Join with Passkey'}
            onPress={join}
            disabled={joinTx.isProcessing || owes || (!isMember && safetyNet === undefined)}
          />
          <Text variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            {isMember
              ? "You're already in this trip."
              : 'New here? Your account is created as you join. Add money to the pot any time after.'}
          </Text>
          <TxOverlay status={joinTx.status} processingTitle="Joining the trip..." />
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Logo size={20} dot={false} />
        </View>
        <Bob style={styles.teko}>
          <Teko mood="love" size={160} bob={false} />
        </Bob>
        <Sparkle size={22} style={{ left: 70, top: 90 }} />
        <Sparkle size={16} color={palette.coin} style={{ right: 70, top: 60 }} delay={800} />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15 }} color={colors.textMuted}>
          {organizer.name} invited you to
        </Text>
        <Text variant="hero">{trip.name}</Text>
      </View>

      {owes && debt ? <DebtNotice debt={debt} action="join" /> : null}

      <Surface style={{ paddingVertical: 6 }}>
        {others.map((m) => (
          <PersonRow key={m.id} member={m} badge={m.id === organizer.id ? 'Organizer' : undefined} />
        ))}
      </Surface>

      <View style={styles.facts}>
        <Fact label="Ends" value={trip.settlesOn} />
        <Fact label="In the pot" value={money(trip.pot)} />
        <Fact label="Approval" value={`Over ${moneyShort(trip.approvalLimit)}`} />
      </View>

      {!isMember && safetyNet !== undefined && safetyNet > 0n && (
        <InfoBox tone={colors.warmBg} icon={<Icon name="shield" size={18} strokeWidth={2} />}>
          {`Safety net: if you spend more than you put in, up to ${moneyShort(safetyNet)} is collected from you automatically at settle-up. Joining means you agree.`}
        </InfoBox>
      )}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.body }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    borderRadius: 30,
    backgroundColor: colors.hero,
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  teko: {
    position: 'absolute',
    alignSelf: 'center',
    top: 56,
  },
  facts: {
    flexDirection: 'row',
    gap: 8,
  },
  fact: {
    flex: 1,
    padding: 12,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
});

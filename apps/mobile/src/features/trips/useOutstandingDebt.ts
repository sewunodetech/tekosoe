import { useQuery } from '@tanstack/react-query';

import { isLive } from '@/lib/env';
import { fetchMyDebts } from '@/lib/envio';

import { useAccount } from '../use-account';

export type OutstandingDebt = { total: bigint; trips: { tripId: string; tripName: string; debt: bigint }[] };

const NONE: OutstandingDebt = { total: 0n, trips: [] };

/** Demo only (`EXPO_PUBLIC_DEMO_DEBT=1`): an unpaid $10 from the settled Bali trip, to show the blocked state. */
const DEMO_DEBT: OutstandingDebt = {
  total: 10_000_000n,
  trips: [{ tripId: 'bali', tripName: 'Bali Weekend', debt: 10_000_000n }],
};

/**
 * Utang yang belum lunas dari trip yang sudah settle (ADR 0013). Selama total > 0, kontrak menolak
 * membuat atau ikut trip baru, jadi layar menahan tombolnya lebih dulu dan menunjukkan invoice yang harus dibayar.
 */
export function useOutstandingDebt() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ['outstanding-debt', address],
    queryFn: async (): Promise<OutstandingDebt> => {
      if (!isLive) return process.env.EXPO_PUBLIC_DEMO_DEBT === '1' ? DEMO_DEBT : NONE;
      if (!address) return NONE;
      const trips = await fetchMyDebts(address);
      return { total: trips.reduce((sum, t) => sum + t.debt, 0n), trips };
    },
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 10_000 : false,
  });
}

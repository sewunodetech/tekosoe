import { useQuery } from '@tanstack/react-query';

import { isLive } from '@/lib/env';
import { fetchMyDebts } from '@/lib/envio';

import { useAccount } from '../use-account';

export type OutstandingDebt = { total: bigint; trips: { tripId: string; tripName: string; debt: bigint }[] };

const NONE: OutstandingDebt = { total: 0n, trips: [] };

/**
 * Utang yang belum lunas dari trip yang sudah settle (ADR 0013). Selama total > 0, kontrak menolak
 * membuat atau ikut trip baru, jadi layar menahan tombolnya lebih dulu dan menunjukkan invoice yang harus dibayar.
 */
export function useOutstandingDebt() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ['outstanding-debt', address],
    queryFn: async (): Promise<OutstandingDebt> => {
      if (!isLive || !address) return NONE;
      const trips = await fetchMyDebts(address);
      return { total: trips.reduce((sum, t) => sum + t.debt, 0n), trips };
    },
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 10_000 : false,
  });
}

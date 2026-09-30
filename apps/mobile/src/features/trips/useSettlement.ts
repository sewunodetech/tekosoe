import { useQuery } from '@tanstack/react-query';

import { settlement } from '@/data/demo';
import { liveSettlement } from '@/data/live';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

/** Hasil settle-up satu trip (F13). Live: Envio (deposited/used/net per anggota). */
export function useSettlement(tripId: string) {
  const { address } = useAccount();
  return useQuery({
    queryKey: ['trip', tripId, 'settlement', address],
    queryFn: async () => {
      if (isLive) return liveSettlement(tripId, address);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { ...settlement, tripId };
    },
    enabled: !!tripId,
  });
}
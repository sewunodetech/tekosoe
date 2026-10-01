import { useQuery } from '@tanstack/react-query';

import { trips } from '@/data/demo';
import { liveTrips } from '@/data/live';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

/** Trip milik user. Live: Envio (grup tempat alamat user jadi anggota) + api (nama). */
export function useTrips() {
  const { account, address } = useAccount();
  return useQuery({
    queryKey: ['trips', address],
    queryFn: async () => {
      if (isLive) return liveTrips(address, account ?? undefined);
      // Simulasi latensi jaringan di mode demo.
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        list: Object.values(trips).filter(t => !t.settled),
        settled: [{ id: 'bali', name: 'Bali Weekend', returnAmount: '$12.50' }],
        totalGotBack: '$12.50',
      };
    },
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 5_000 : false,
  });
}
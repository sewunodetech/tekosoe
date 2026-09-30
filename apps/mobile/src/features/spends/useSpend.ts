import { useQuery } from '@tanstack/react-query';

import { getSpend } from '@/data/demo';
import { liveSpend } from '@/data/live';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

/** Satu pemakaian. Live butuh `tripId` (id pemakaian unik per trip). */
export function useSpend(id: string, tripId?: string) {
  const { account, address } = useAccount();
  return useQuery({
    queryKey: ['spend', tripId, id, address],
    queryFn: async () => {
      if (isLive) {
        if (!tripId) throw new Error('This payment could not be found');
        return liveSpend(tripId, id, address, account ?? undefined);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getSpend(id);
    },
    enabled: !!id,
    refetchInterval: isLive ? 4_000 : false,
  });
}
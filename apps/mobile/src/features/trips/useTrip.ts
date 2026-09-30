import { useQuery } from '@tanstack/react-query';

import { getTrip } from '@/data/demo';
import { liveTrip } from '@/data/live';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

export function useTrip(id: string) {
  const { account, address } = useAccount();
  return useQuery({
    queryKey: ['trip', id, address],
    queryFn: async () => {
      if (isLive) return liveTrip(id, address, account ?? undefined);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getTrip(id);
    },
    enabled: !!id,
    refetchInterval: isLive ? 4_000 : false,
  });
}
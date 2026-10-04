import { useQuery } from '@tanstack/react-query';

import { tripSafetyNet } from '@/data/live/actions';
import { isLive } from '@/lib/env';
import { usd } from '@/lib/money';

/** Safety net trip (pilihan pembuat di 04 New trip), ditampilkan di 05 Invite sebelum gabung. */
export function useTripSafetyNet(tripId: string) {
  return useQuery({
    queryKey: ['trip-safety-net', tripId],
    queryFn: () => (isLive ? tripSafetyNet(tripId) : Promise.resolve(usd(50))),
    staleTime: 5 * 60_000,
  });
}

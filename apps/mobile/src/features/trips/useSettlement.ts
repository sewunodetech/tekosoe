import { useQuery } from '@tanstack/react-query';

import { settlement } from '@/data/demo';

/** Hasil settle-up satu trip (F13). TODO (M6): Envio Settled/Pulled/Refunded. */
export function useSettlement(tripId: string) {
  return useQuery({
    queryKey: ['trip', tripId, 'settlement'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { ...settlement, tripId };
    },
    enabled: !!tripId,
  });
}

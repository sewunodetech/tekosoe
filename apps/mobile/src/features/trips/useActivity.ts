import { useQuery } from '@tanstack/react-query';
import { getTrip } from '@/data/demo';

export function useActivity(tripId: string) {
  return useQuery({
    queryKey: ['trip', tripId, 'activity'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getTrip(tripId).activity;
    },
    enabled: !!tripId,
  });
}

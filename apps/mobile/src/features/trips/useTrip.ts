import { useQuery } from '@tanstack/react-query';
import { getTrip } from '@/data/demo';

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getTrip(id);
    },
    enabled: !!id,
  });
}

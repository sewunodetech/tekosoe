import { useQuery } from '@tanstack/react-query';
import { getSpend } from '@/data/demo';

export function useSpend(id: string) {
  return useQuery({
    queryKey: ['spend', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getSpend(id);
    },
    enabled: !!id,
  });
}

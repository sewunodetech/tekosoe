import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '@/data/demo';

export function useInvoice(userId: string) {
  return useQuery({
    queryKey: ['invoice', userId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getInvoice(userId);
    },
    enabled: !!userId,
  });
}

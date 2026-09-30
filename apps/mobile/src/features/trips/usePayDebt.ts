import { useMutation, useQueryClient } from '@tanstack/react-query';

import { payDebt } from '@/data/live/actions';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export function usePayDebt(tripId: string) {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (data: { amount: bigint }) => {
      if (isLive) await payDebt(requireAccount(account), tripId, data.amount);
      // Mock network delay (M4 Demo mode)
      else await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}
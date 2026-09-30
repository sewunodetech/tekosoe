import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deposit } from '@/data/live/actions';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export function useDeposit(tripId: string) {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (data: { amount: number }) => {
      if (isLive) {
        await deposit(requireAccount(account), tripId, data.amount);
        return { success: true, tripId, ...data };
      }
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}
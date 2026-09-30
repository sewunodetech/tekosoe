import { useMutation, useQueryClient } from '@tanstack/react-query';

import { approveSpend } from '@/data/live/actions';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export function useApproveSpend(tripId: string, spendId: string) {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async () => {
      if (isLive) await approveSpend(requireAccount(account), tripId, spendId);
      // Mock network delay (M4 Demo mode)
      else await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, spendId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spend'] });
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
  });
}
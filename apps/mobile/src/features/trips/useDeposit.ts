import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deposit } from '@/data/live/actions';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export function useDeposit(tripId: string) {
  const queryClient = useQueryClient();
  const { account, address } = useAccount();

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
    onMutate: async (data) => {
      const queryKey = ['trip', tripId, address];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any>(queryKey);
      if (previous) {
        queryClient.setQueryData<any>(queryKey, {
          ...previous,
          pot: previous.pot + BigInt(data.amount) * 1000000n,
          myBalance: previous.myBalance + BigInt(data.amount) * 1000000n,
        });
      }
      return { previous, queryKey };
    },
    onError: (err, newReq, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}
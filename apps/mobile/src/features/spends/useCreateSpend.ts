import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSpend } from '@/data/live/actions';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export type CreateSpendInput = {
  amount: bigint;
  title: string;
  category: string;
  /** Alamat peserta (live) atau id anggota demo, sejajar dengan `shares`. */
  participants: string[];
  shares: bigint[];
};

export function useCreateSpend(tripId: string) {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (data: CreateSpendInput) => {
      if (isLive) {
        return createSpend(requireAccount(account), tripId, {
          ...data,
          participants: data.participants as `0x${string}`[],
        });
      }
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { spendId: 'new-spend', pending: false };
    },
    onMutate: async (data) => {
      const queryKey = ['trip', tripId, account?.address ?? ''];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any>(queryKey);
      if (previous && !isLive) {
        queryClient.setQueryData<any>(queryKey, {
          ...previous,
          pot: previous.pot - data.amount,
          myBalance: previous.myBalance - data.amount,
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
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
  });
}
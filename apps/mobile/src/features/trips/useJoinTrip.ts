import { useMutation, useQueryClient } from '@tanstack/react-query';

import { joinTrip } from '@/data/live/actions';
import { isLive } from '@/lib/env';
import { tripIdFromInvite } from '@/lib/invite';

import { requireAccount, useAccount } from '../use-account';

/** `code` = kode undangan (live: `${groupId}-${secret}`; demo: id trip). */
export function useJoinTrip(code: string) {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (data: { putIn: number; safetyNet: number }) => {
      if (isLive) return { success: true, ...(await joinTrip(requireAccount(account), code, data)) };
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId: code, ...data };
    },
    onMutate: async (data) => {
      const tripId = tripIdFromInvite(code);
      const queryKey = ['trip', tripId, account?.address ?? ''];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any>(queryKey);
      if (previous) {
        queryClient.setQueryData<any>(queryKey, {
          ...previous,
          pot: previous.pot + BigInt(data.putIn) * 1000000n,
          myBalance: previous.myBalance + BigInt(data.putIn) * 1000000n,
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
      queryClient.invalidateQueries({ queryKey: ['trip', tripIdFromInvite(code)] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTrip } from '@/data/live/actions';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (data: { name: string; endsAt: Date; limit: number; safetyNet: number }) => {
      if (isLive) return createTrip(requireAccount(account), data);
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { id: 'japan', inviteCode: 'japan', ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
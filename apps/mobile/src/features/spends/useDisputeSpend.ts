import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDisputeSpend(tripId: string, spendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, spendId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spend', spendId] });
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAttachReceipt(tripId: string, spendId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { receiptUri?: string }) => {
      // Mock network & encryption delay (M7 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, spendId, ...data };
    },
    onSuccess: () => {
      if (spendId) {
        queryClient.invalidateQueries({ queryKey: ['spend', spendId] });
      }
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
  });
}

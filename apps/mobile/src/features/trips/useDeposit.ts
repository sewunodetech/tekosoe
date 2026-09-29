import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeposit(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { amount: number }) => {
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

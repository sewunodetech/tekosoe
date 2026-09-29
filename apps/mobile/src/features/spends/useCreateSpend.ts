import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateSpend(tripId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { amount: number; splits: Record<string, number> }) => {
      // Mock network delay (M4 Demo mode)
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { id: 'new-spend', tripId, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    }
  });
}

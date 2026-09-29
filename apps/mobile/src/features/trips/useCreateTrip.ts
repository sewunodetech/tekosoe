import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; endsAt: Date; limit: number }) => {
      // Mock network delay (M4 Demo mode)
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { id: 'japan', ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
}

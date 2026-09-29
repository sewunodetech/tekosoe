import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useJoinTrip(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { putIn: number; safetyNet: number }) => {
      // Mock network delay (M4 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId: code, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', code] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

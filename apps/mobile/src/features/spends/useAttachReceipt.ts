import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isLive } from '@/lib/env';

/**
 * Struk (M7): kompres → enkripsi di HP → unggah lewat api → attachReceipt.
 * Enkripsi + unggah belum tersambung, jadi di mode live gagal terus terang, bukan pura-pura berhasil.
 */
export function useAttachReceipt(tripId: string, spendId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { receiptUri?: string }) => {
      if (isLive) throw new Error('Receipts are not available yet on this version.');
      // Mock network & encryption delay (M7 Demo mode)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, tripId, spendId, ...data };
    },
    onSuccess: () => {
      if (spendId) {
        queryClient.invalidateQueries({ queryKey: ['spend'] });
      }
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
  });
}
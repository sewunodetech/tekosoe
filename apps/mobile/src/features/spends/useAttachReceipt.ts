import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attachReceipt } from '@/data/live/receipts';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';
import { saveDemoReceipt } from './demo-receipts';

/**
 * Struk (M7, ADR 0008). Live: kompres → enkripsi kunci trip di HP → unggah ciphertext → `attachReceipt` on-chain.
 * Demo: foto disimpan di memori supaya R3 menampilkan foto yang benar-benar dipilih.
 * `spendId` bisa diberikan saat hook dibuat (R1 untuk pemakaian lama) atau per panggilan (09 setelah `spend`).
 */
export function useAttachReceipt(tripId: string, spendId?: string) {
  const queryClient = useQueryClient();
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (data: { receiptUri: string; spendId?: string }) => {
      const target = data.spendId ?? spendId;
      if (!target) throw new Error('This payment could not be found');
      if (isLive) {
        await attachReceipt(requireAccount(account), tripId, target, data.receiptUri);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        saveDemoReceipt(tripId, target, data.receiptUri);
      }
      return { tripId, spendId: target };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spend'] });
      queryClient.invalidateQueries({ queryKey: ['spends', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

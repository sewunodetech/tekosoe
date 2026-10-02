import { useMutation } from '@tanstack/react-query';

import type { Spend } from '@/data/types';
import { openReceipt } from '@/data/live/receipts';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';
import { demoReceipt } from './demo-receipts';

/**
 * R2 → R3: buka struk terbaru dari satu pemakaian. Live: unduh ciphertext, cocokkan sidik jarinya dengan
 * data on-chain, lalu dekripsi di HP. Demo: foto yang dilampirkan di sesi ini, atau `null` (struk contoh).
 */
export function useOpenReceipt(tripId: string, spend: Spend) {
  const { account } = useAccount();

  return useMutation({
    mutationFn: async (): Promise<{ uri: string } | null> => {
      if (isLive) {
        const latest = spend.receipts?.[0];
        if (!latest) throw new Error('No receipt has been added to this payment yet.');
        return openReceipt(requireAccount(account), tripId, spend.id, latest.hash);
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      const uri = demoReceipt(tripId, spend.id);
      return uri ? { uri } : null;
    },
  });
}

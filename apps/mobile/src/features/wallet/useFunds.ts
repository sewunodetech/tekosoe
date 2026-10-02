import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cashOut, TOP_UP_MAX, topUpBalance } from '@/data/live/actions';
import { ausdBalance } from '@/lib/chain';
import { isLive } from '@/lib/env';
import { usd } from '@/lib/money';

import { addDemoFeedItem } from '../activity/useFeed';
import { requireAccount, useAccount } from '../use-account';

/** Batas satu kali "Top up" di testnet (jatah satu permintaan faucet AUSD Agora). */
export { TOP_UP_MAX };

const balanceKey = (address: string) => ['ausd', 'balance', address] as const;

/**
 * Saldo dolar (AUSD) milik akun ini — di luar trip, siap dimasukkan ke pot mana pun. Demo: angka cerita.
 * Hanya berubah lewat "Top up" / "Cash out" di kartu saldo (Profile), setoran ke pot, dan pengembalian settle-up.
 */
export function useBalance(demoDollars = 420) {
  const { address } = useAccount();
  return useQuery({
    queryKey: balanceKey(address),
    queryFn: async () => (isLive ? ausdBalance(address as `0x${string}`) : usd(demoDollars)),
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 8_000 : false,
    // Demo: angka cerita tidak berubah sendiri; jangan timpa hasil "Top up" saat layar dibuka lagi.
    staleTime: isLive ? 0 : Infinity,
  });
}

/**
 * "Top up" sebesar nominal pilihan user. Testnet: faucet AUSD (simulasi on-ramp dari mata uang lokal).
 * Demo: menambah angka cerita setelah jeda singkat.
 */
export function useTopUp() {
  const queryClient = useQueryClient();
  const { account, address } = useAccount();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (isLive) {
        await topUpBalance(requireAccount(account), amount);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      queryClient.setQueryData<bigint>(balanceKey(address), (current) => (current ?? 0n) + amount);
      addDemoFeedItem(queryClient, address, {
        id: `topup-${Date.now()}`,
        kind: 'topUp',
        title: 'Top up',
        sub: 'Added to your dollars',
        amount,
        at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      if (isLive) queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}

/** "Cash out" dari kartu saldo. Testnet: dolar keluar ke "bank" demo (simulasi off-ramp). Demo: kurangi angka cerita. */
export function useCashOut() {
  const queryClient = useQueryClient();
  const { account, address } = useAccount();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (isLive) {
        await cashOut(requireAccount(account), amount);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      queryClient.setQueryData<bigint>(balanceKey(address), (current) => {
        const now = current ?? 0n;
        return now > amount ? now - amount : 0n;
      });
      addDemoFeedItem(queryClient, address, {
        id: `cashout-${Date.now()}`,
        kind: 'cashOut',
        title: 'Cash out',
        sub: 'Sent to your bank (demo)',
        amount: -amount,
        at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      if (isLive) queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}

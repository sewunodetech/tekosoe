import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cashOut, topUpBalance } from '@/data/live/actions';
import { ausdBalance } from '@/lib/chain';
import { isLive } from '@/lib/env';
import { usd } from '@/lib/money';

import { requireAccount, useAccount } from '../use-account';

/** Nominal satu kali "Top up" di testnet (faucet AUSD Agora memberi 10.000 per permintaan). */
export const TOP_UP_AMOUNT = usd(10_000);

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
 * "Top up" dari kartu saldo. Testnet: faucet AUSD (simulasi on-ramp dari mata uang lokal).
 * Demo: menambah angka cerita setelah jeda singkat.
 */
export function useTopUp() {
  const queryClient = useQueryClient();
  const { account, address } = useAccount();
  return useMutation({
    mutationFn: async () => {
      if (isLive) {
        await topUpBalance(requireAccount(account));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      queryClient.setQueryData<bigint>(balanceKey(address), (current) => (current ?? 0n) + TOP_UP_AMOUNT);
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
    },
    onSuccess: () => {
      if (isLive) queryClient.invalidateQueries({ queryKey: ['ausd'] });
    },
  });
}

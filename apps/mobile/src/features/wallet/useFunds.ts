import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addDemoFunds } from '@/data/live/actions';
import { ausdBalance } from '@/lib/chain';
import { isLive } from '@/lib/env';
import { usd } from '@/lib/money';

import { requireAccount, useAccount } from '../use-account';

/** Saldo dolar (AUSD) milik akun ini. Demo: angka cerita. */
export function useBalance(demoDollars = 420) {
  const { address } = useAccount();
  return useQuery({
    queryKey: ['ausd', 'balance', address],
    queryFn: async () => (isLive ? ausdBalance(address as `0x${string}`) : usd(demoDollars)),
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 8_000 : false,
  });
}

/** Testnet: "Add demo funds" dari faucet AUSD Agora. */
export function useAddDemoFunds() {
  const queryClient = useQueryClient();
  const { account } = useAccount();
  return useMutation({
    mutationFn: async () => {
      if (!isLive) return;
      await addDemoFunds(requireAccount(account));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ausd'] }),
  });
}
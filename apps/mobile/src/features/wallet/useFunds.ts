import { useQuery } from '@tanstack/react-query';

import { ausdBalance } from '@/lib/chain';
import { isLive } from '@/lib/env';
import { usd } from '@/lib/money';

import { useAccount } from '../use-account';

/**
 * Saldo dolar (AUSD) milik akun ini. Demo: angka cerita.
 * Testnet: diisi otomatis (setelah masuk dan saat saldo kurang), lihat `ensureBalance` di data/live/actions.
 */
export function useBalance(demoDollars = 420) {
  const { address } = useAccount();
  return useQuery({
    queryKey: ['ausd', 'balance', address],
    queryFn: async () => (isLive ? ausdBalance(address as `0x${string}`) : usd(demoDollars)),
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 8_000 : false,
  });
}

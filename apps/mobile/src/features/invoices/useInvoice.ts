import { useQuery } from '@tanstack/react-query';

import { getInvoice } from '@/data/demo';
import { liveInvoice } from '@/data/live';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

/** Invoice. Demo: `who` memilih anggota cerita. Live: invoice milik akun ini (api + Envio). */
export function useInvoice(tripId: string, who: string) {
  const { account, address } = useAccount();
  return useQuery({
    queryKey: ['invoice', tripId, isLive ? address : who],
    queryFn: async () => {
      if (isLive) return liveInvoice(tripId, requireAccount(account));
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getInvoice(who);
    },
    enabled: isLive ? Boolean(tripId && account) : Boolean(who),
  });
}
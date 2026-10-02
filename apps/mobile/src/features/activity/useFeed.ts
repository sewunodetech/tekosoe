import { useQuery, type QueryClient } from '@tanstack/react-query';

import { feed } from '@/data/demo';
import { liveFeed } from '@/data/live';
import type { FeedItem } from '@/data/types';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

const feedKey = (address: string) => ['feed', address] as const;

/**
 * Riwayat user di layar Activity: Top up / Cash out + kejadian di semua trip (setor, bayar,
 * persetujuan, struk, settle-up, kembalian). Live: Envio (polling) + api (nama, judul).
 */
export function useFeed() {
  const { account, address } = useAccount();
  return useQuery({
    queryKey: feedKey(address),
    queryFn: async () => {
      if (isLive) return liveFeed(address, account ?? undefined);
      // Simulasi latensi jaringan di mode demo.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return feed;
    },
    enabled: !isLive || Boolean(address),
    refetchInterval: isLive ? 5_000 : false,
    // Demo: baris dari Top up / Cash out ditambahkan ke cache; jangan ditimpa cerita awal saat layar dibuka lagi.
    staleTime: isLive ? 0 : Infinity,
  });
}

/** Demo: catat Top up / Cash out di Activity (live: Envio yang mencatat). */
export function addDemoFeedItem(queryClient: QueryClient, address: string, item: FeedItem) {
  queryClient.setQueryData<FeedItem[]>(feedKey(address), (current) => [item, ...(current ?? feed)]);
}

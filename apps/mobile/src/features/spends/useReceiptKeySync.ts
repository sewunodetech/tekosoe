import { useEffect } from 'react';

import { syncReceiptKeys } from '@/data/live/receipts';
import { isLive } from '@/lib/env';

import { useAccount } from '../use-account';

/** Bagikan kunci struk ke teman di trip-trip ini di latar belakang (ADR 0008). Live saja. */
export function useReceiptKeySync(tripIds: string[]) {
  const { account } = useAccount();
  const key = tripIds.join(',');

  useEffect(() => {
    if (!isLive || !account || !key) return;
    for (const tripId of key.split(',')) void syncReceiptKeys(account, tripId);
  }, [account, key]);
}

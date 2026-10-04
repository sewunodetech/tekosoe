import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { flagKeys, getFlag, setFlag } from '@/lib/device-flags';
import { useSession } from '@/providers/session-provider';

/**
 * Tour tampil sekali per akun di perangkat ini, atau lagi lewat `/trips?tour=<id unik>` (Help di P2).
 * ID unik supaya tour bisa diputar ulang berkali-kali.
 */
export function useTour() {
  const { signer } = useSession();
  const address = signer?.address;
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [seen, setSeen] = useState<{ address: string; seen: boolean } | null>(null);
  const [closedReplay, setClosedReplay] = useState<string>();

  useEffect(() => {
    if (!address) return;
    let alive = true;
    getFlag(flagKeys.tourSeen(address)).then((value) => alive && setSeen({ address, seen: value }));
    return () => {
      alive = false;
    };
  }, [address]);

  const replay = !!tour && tour !== closedReplay;
  const firstTime = !!seen && seen.address === address && !seen.seen;
  const show = !!address && (replay || firstTime);

  const done = () => {
    if (!address) return;
    setSeen({ address, seen: true });
    void setFlag(flagKeys.tourSeen(address));
    if (tour) {
      setClosedReplay(tour);
      router.setParams({ tour: undefined });
    }
  };

  return { show, done };
}

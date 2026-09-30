import type { LocalAccount } from 'viem';

import { useSession } from '@/providers/session-provider';

/** Akun yang sedang masuk; mutation live gagal dengan pesan ramah kalau sesi belum ada. */
export function useAccount(): { account: LocalAccount | null; address: string } {
  const { signer } = useSession();
  return { account: signer?.account ?? null, address: signer?.address ?? '' };
}

export function requireAccount(account: LocalAccount | null): LocalAccount {
  if (!account) throw new Error('Please sign in again.');
  return account;
}

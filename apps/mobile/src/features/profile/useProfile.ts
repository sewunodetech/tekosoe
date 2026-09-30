import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { forgetProfile, liveProfile } from '@/data/live';
import { clearProfile, loadProfile, saveProfile } from '@/data/profile-store';
import type { Profile } from '@/data/types';
import { api } from '@/lib/api';
import { countryCode } from '@/lib/countries';
import { isLive } from '@/lib/env';

import { requireAccount, useAccount } from '../use-account';

export const profileKey = ['profile'] as const;

/** Profil user sendiri; `null` = belum mengisi P1 Set up profile. Live: api → `profiles`. */
export function useProfile(enabled = true) {
  const { account, address } = useAccount();
  return useQuery({
    queryKey: [...profileKey, address],
    queryFn: async () => (isLive ? liveProfile(requireAccount(account)) : loadProfile()),
    enabled: enabled && (!isLive || Boolean(account)),
    staleTime: Infinity,
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  const { account } = useAccount();
  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!isLive) return saveProfile(profile);
      const signed = requireAccount(account);
      await api.saveProfile(signed, {
        displayName: profile.name,
        countryCode: countryCode(profile.country),
        city: profile.city || undefined,
        avatarColor: profile.tint || undefined,
      });
      forgetProfile(signed.address);
      return profile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKey }),
  });
}

export function useClearProfile() {
  const qc = useQueryClient();
  return useMutation({
    // Live: profil tetap di api (publik); keluar hanya menghapus cache di perangkat.
    mutationFn: async () => (isLive ? undefined : clearProfile()),
    onSuccess: () => qc.removeQueries({ queryKey: profileKey }),
  });
}

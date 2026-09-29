import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearProfile, loadProfile, saveProfile } from '@/data/profile-store';
import type { Profile } from '@/data/types';

export const profileKey = ['profile'] as const;

/** Profil user sendiri; `null` = belum mengisi P1 Set up profile. */
export function useProfile(enabled = true) {
  return useQuery({ queryKey: profileKey, queryFn: loadProfile, enabled, staleTime: Infinity });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: Profile) => saveProfile(profile),
    onSuccess: (profile) => qc.setQueryData(profileKey, profile),
  });
}

export function useClearProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearProfile,
    onSuccess: () => qc.setQueryData(profileKey, null),
  });
}

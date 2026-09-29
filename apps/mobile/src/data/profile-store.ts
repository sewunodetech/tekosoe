import * as SecureStore from 'expo-secure-store';

import type { Profile } from './types';

/**
 * Penyimpanan profil user sendiri.
 * Mode demo: SecureStore di HP (web tidak punya SecureStore → disimpan di memori saja).
 * TODO (M6/M12 live): baca/tulis lewat api → `profiles`, dengan permintaan bertanda tangan EIP-191.
 */
const KEY = 'tekosoe_profile';
let memory: Profile | null = null;

export async function loadProfile(): Promise<Profile | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw) memory = JSON.parse(raw) as Profile;
  } catch {
    // SecureStore tidak tersedia (web) — pakai memori.
  }
  return memory;
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  memory = profile;
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(profile));
  } catch {
    // web: cukup di memori
  }
  return profile;
}

export async function clearProfile(): Promise<void> {
  memory = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // web
  }
}

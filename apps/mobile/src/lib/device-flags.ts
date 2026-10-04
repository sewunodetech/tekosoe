import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Penanda sekali-lihat di perangkat (onboarding, tour). Bukan data uang atau akun, jadi tidak ke database
 * dan tidak butuh biometrik. Web (mode demo) tidak punya SecureStore → localStorage.
 */
export const flagKeys = {
  onboardingSeen: 'tekosoe_onboarding_seen',
  /** Per akun: akun lain di HP yang sama tetap dapat tour sendiri. */
  tourSeen: (address: string) => `tekosoe_tour_seen_${address.toLowerCase()}`,
};

export async function getFlag(key: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) === '1';
    return (await SecureStore.getItemAsync(key)) === '1';
  } catch {
    return false;
  }
}

export async function setFlag(key: string, on = true): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (on) globalThis.localStorage?.setItem(key, '1');
      else globalThis.localStorage?.removeItem(key);
      return;
    }
    if (on) await SecureStore.setItemAsync(key, '1');
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Gagal simpan = paling buruk onboarding/tour muncul sekali lagi.
  }
}

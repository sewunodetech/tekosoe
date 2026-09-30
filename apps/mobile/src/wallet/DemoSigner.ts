import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Address, Hex, LocalAccount } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import type { Signer } from './types';

const KEY = 'tekosoe_demo_key';

async function readKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function writeKey(value: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (value) globalThis.localStorage?.setItem(KEY, value);
      else globalThis.localStorage?.removeItem(KEY);
    } else if (value) {
      await SecureStore.setItemAsync(KEY, value);
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  } catch {
    // Tidak ada penyimpanan: kunci hanya hidup selama sesi.
  }
}

/**
 * Penanda tangan untuk web / Expo Go (tanpa passkey): kunci acak khusus perangkat ini,
 * disimpan lokal. Menandatangani sungguhan, jadi mode `live` bisa dicoba di web dengan AUSD testnet.
 * Jangan dipakai untuk dana sungguhan.
 */
export class DemoSigner implements Signer {
  readonly account: LocalAccount;

  private constructor(privateKey: Hex) {
    this.account = privateKeyToAccount(privateKey);
  }

  static async load(): Promise<DemoSigner> {
    let key = (await readKey()) as Hex | null;
    if (!key) {
      key = generatePrivateKey();
      await writeKey(key);
    }
    return new DemoSigner(key);
  }

  static async forget(): Promise<void> {
    await writeKey(null);
  }

  get address(): Address {
    return this.account.address;
  }

  end(): void {}
}

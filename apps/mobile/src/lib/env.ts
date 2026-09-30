import { Platform } from 'react-native';
import { AUSD_TESTNET_ADDRESS, AUSD_TESTNET_FAUCET_ADDRESS } from '@tekosoe/shared';

// Expo meng-inline EXPO_PUBLIC_* saat build, jadi setiap variabel harus diakses secara statis.
export const env = {
  monadRpcUrl: process.env.EXPO_PUBLIC_MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz',
  ausdAddress: (process.env.EXPO_PUBLIC_AUSD_ADDRESS || AUSD_TESTNET_ADDRESS) as `0x${string}`,
  ausdFaucetAddress: (process.env.EXPO_PUBLIC_AUSD_FAUCET_ADDRESS || AUSD_TESTNET_FAUCET_ADDRESS) as `0x${string}`,
  groupVaultAddress: process.env.EXPO_PUBLIC_GROUP_VAULT_ADDRESS as `0x${string}` | undefined,
  envioGraphqlUrl: process.env.EXPO_PUBLIC_ENVIO_GRAPHQL_URL,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  passkeyDomain: process.env.EXPO_PUBLIC_PASSKEY_DOMAIN ?? 'tekosoe.xyz',
  /** Domain tautan undangan & verifikasi invoice (apps/web). */
  webDomain: process.env.EXPO_PUBLIC_WEB_DOMAIN ?? 'tekosoe.xyz',
  /** Penerima pembayaran "toko demo" (layar Pay / Card). Testnet saja. */
  demoShopAddress: process.env.EXPO_PUBLIC_DEMO_SHOP_ADDRESS as `0x${string}` | undefined,
  /** Jeda keberatan + settle setelah tanggal berakhir, detik. Demo pakai singkat. */
  disputeWindowSeconds: Number(process.env.EXPO_PUBLIC_DISPUTE_WINDOW_SECONDS ?? 3600),
  /** Sumber data layar: `demo` (src/data/demo) atau `live` (Envio + api + GroupVault). */
  dataSource: (process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'demo') as 'demo' | 'live',
  /**
   * Penanda tangan: `mera` (passkey asli, butuh dev build) atau `demo` (kunci lokal perangkat).
   * Default: `demo` di web (tidak ada passkey), `mera` di HP.
   */
  signer: (process.env.EXPO_PUBLIC_SIGNER ?? (Platform.OS === 'web' ? 'demo' : 'mera')) as 'mera' | 'demo',
} as const;

export const isLive = env.dataSource === 'live';

/** Nilai env yang wajib ada untuk mode live; dilempar sebagai error yang bisa dibaca di QueryState. */
export function requireLive<K extends 'groupVaultAddress' | 'envioGraphqlUrl' | 'apiUrl'>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (!value) {
    const names = { groupVaultAddress: 'EXPO_PUBLIC_GROUP_VAULT_ADDRESS', envioGraphqlUrl: 'EXPO_PUBLIC_ENVIO_GRAPHQL_URL', apiUrl: 'EXPO_PUBLIC_API_URL' };
    throw new Error(`${names[key]} is not set`);
  }
  return value as NonNullable<(typeof env)[K]>;
}

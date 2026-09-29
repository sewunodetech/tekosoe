import { Platform } from 'react-native';

// Expo meng-inline EXPO_PUBLIC_* saat build, jadi setiap variabel harus diakses secara statis.
export const env = {
  monadRpcUrl: process.env.EXPO_PUBLIC_MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz',
  ausdAddress: process.env.EXPO_PUBLIC_AUSD_ADDRESS,
  groupVaultAddress: process.env.EXPO_PUBLIC_GROUP_VAULT_ADDRESS,
  envioGraphqlUrl: process.env.EXPO_PUBLIC_ENVIO_GRAPHQL_URL,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  passkeyDomain: process.env.EXPO_PUBLIC_PASSKEY_DOMAIN ?? 'tekosoe.app',
  /** Sumber data layar: `demo` (src/data/demo) atau `live` (Envio + api). Adapter live dibuat di M6. */
  dataSource: (process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'demo') as 'demo' | 'live',
  /**
   * Penanda tangan: `mera` (passkey asli, butuh dev build) atau `demo` (tanpa passkey).
   * Default: `demo` di web (tidak ada passkey/SecureStore), `mera` di HP.
   */
  signer: (process.env.EXPO_PUBLIC_SIGNER ?? (Platform.OS === 'web' ? 'demo' : 'mera')) as 'mera' | 'demo',
} as const;

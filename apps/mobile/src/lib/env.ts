// Expo meng-inline EXPO_PUBLIC_* saat build, jadi setiap variabel harus diakses secara statis.
export const env = {
  monadRpcUrl: process.env.EXPO_PUBLIC_MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz',
  ausdAddress: process.env.EXPO_PUBLIC_AUSD_ADDRESS,
  groupVaultAddress: process.env.EXPO_PUBLIC_GROUP_VAULT_ADDRESS,
  envioGraphqlUrl: process.env.EXPO_PUBLIC_ENVIO_GRAPHQL_URL,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  passkeyDomain: process.env.EXPO_PUBLIC_PASSKEY_DOMAIN,
} as const;

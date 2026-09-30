import { createWalletClient, http, type Hex, type Transport, type WalletClient } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import type { Env } from "../config/env";
import { mutexFor, type Mutex } from "../lib/mutex";

/**
 * The only two keys this service owns. They pay for nothing but two operations:
 * dripping a little MON to brand new accounts and calling settle(groupId).
 * Keys are read from the environment here (and validated in config/env.ts) and are
 * never logged, returned, or stored anywhere else.
 */
export type MonadWalletClient = WalletClient<Transport, typeof monadTestnet, PrivateKeyAccount>;

export interface WalletHandle {
  account: PrivateKeyAccount;
  client: MonadWalletClient;
  mutex: Mutex;
}

export interface Wallets {
  drip: WalletHandle;
  settler: WalletHandle;
}

export function createWallets(env: Env): Wallets {
  const transport = () =>
    http(env.MONAD_TESTNET_RPC_URL, { timeout: 15_000, retryCount: 2 });

  // Validated as 0x-prefixed 32-byte keys in config/env.ts.
  const dripKey = env.DRIP_PRIVATE_KEY as Hex;
  const settlerKey = env.SETTLER_PRIVATE_KEY as Hex;
  const dripAccount = privateKeyToAccount(dripKey);
  const settlerAccount = privateKeyToAccount(settlerKey);

  const handle = (account: PrivateKeyAccount): WalletHandle => ({
    account,
    client: createWalletClient({
      chain: monadTestnet,
      transport: transport(),
      account,
    }),
    mutex: mutexFor(account.address),
  });

  return {
    drip: handle(dripAccount),
    settler: handle(settlerAccount),
  };
}

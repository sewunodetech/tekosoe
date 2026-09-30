import { createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import type { Env } from "../config/env";

export type PublicClient = ReturnType<typeof createPublicClient>;

export function createPublicChainClient(env: Env): PublicClient {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(env.MONAD_TESTNET_RPC_URL, { timeout: 15_000, retryCount: 2 }),
  });
}

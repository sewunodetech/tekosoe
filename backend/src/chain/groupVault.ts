import type { Address, Hash, Hex } from "viem";
import type { Env } from "../config/env";
import type { Logger } from "../lib/logger";
import { groupVaultAbi } from "./abi";
import { createPublicChainClient, type PublicClient } from "./clients";
import { createWallets, type Wallets } from "./wallets";

export interface GroupView {
  name: string;
  creator: Address;
  inviteHash: Hex;
  endsAt: number;
  disputeWindow: number;
  approvalThreshold: bigint;
  pool: bigint;
  status: number;
}

export interface SpendView {
  spender: Address;
  to: Address;
  amount: bigint;
  executedAt: number;
  status: number;
  noteHash: Hex;
}

export type SimulateResult =
  | { ok: true }
  | { ok: false; alreadySettled: boolean; reason: string };

/**
 * Every chain read/write the API needs, behind one interface so tests can fake it.
 * Nothing here ever touches user keys or user funds.
 */
export interface ChainService {
  readonly dripAddress: Address;
  readonly settlerAddress: Address;
  getChainId(): Promise<number>;
  getLatestBlockTimestamp(): Promise<number>;
  hasContractCode(address: Address): Promise<boolean>;
  getNativeBalance(address: Address): Promise<bigint>;
  getGroup(groupId: bigint): Promise<GroupView>;
  membersOf(groupId: bigint): Promise<Address[]>;
  getSpend(groupId: bigint, spendId: bigint): Promise<SpendView>;
  simulateSettle(groupId: bigint): Promise<SimulateResult>;
  sendSettle(groupId: bigint): Promise<{ hash: Hash; ok: boolean }>;
  sendDrip(to: Address, amountWei: bigint): Promise<Hash>;
}

/**
 * ASSUMPTION: the contract signals "already settled" with a revert whose message
 * contains one of these fragments. Confirm against the real custom errors.
 */
const SETTLED_PATTERNS = [
  /already[_ ]?settled/i,
  /group[_ ]?is[_ ]?settled/i,
  /not[_ ]?active/i,
  /group[_ ]?not[_ ]?active/i,
  /settled/i,
];

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { shortMessage?: string; message?: string };
    return candidate.shortMessage ?? candidate.message ?? String(error);
  }
  return String(error);
}

export function createChainService(options: {
  env: Env;
  logger: Logger;
  publicClient?: PublicClient;
  wallets?: Wallets;
}): ChainService {
  const { env, logger } = options;
  const publicClient = options.publicClient ?? createPublicChainClient(env);
  const wallets = options.wallets ?? createWallets(env);
  const address = env.GROUP_VAULT_ADDRESS as Address;
  const contract = { address, abi: groupVaultAbi } as const;

  return {
    dripAddress: wallets.drip.account.address,
    settlerAddress: wallets.settler.account.address,

    async getChainId() {
      return publicClient.getChainId();
    },

    async getLatestBlockTimestamp() {
      const block = await publicClient.getBlock({ blockTag: "latest" });
      return Number(block.timestamp);
    },

    async hasContractCode(target) {
      const code = await publicClient.getCode({ address: target });
      return typeof code === "string" && code !== "0x" && code.length > 2;
    },

    async getNativeBalance(target) {
      return publicClient.getBalance({ address: target });
    },

    async getGroup(groupId) {
      // viem decodes multiple outputs positionally (verified), even though the types
      // also expose named fields — destructure by index.
      const result = (await publicClient.readContract({
        ...contract,
        functionName: "getGroup",
        args: [groupId],
      })) as unknown as [string, Address, Hex, bigint, bigint, bigint, bigint, number];

      return {
        name: result[0],
        creator: result[1],
        inviteHash: result[2],
        endsAt: Number(result[3]),
        disputeWindow: Number(result[4]),
        approvalThreshold: BigInt(result[5]),
        pool: BigInt(result[6]),
        status: Number(result[7]),
      };
    },

    async membersOf(groupId) {
      const members = (await publicClient.readContract({
        ...contract,
        functionName: "membersOf",
        args: [groupId],
      })) as Address[];
      return [...members];
    },

    async getSpend(groupId, spendId) {
      const result = (await publicClient.readContract({
        ...contract,
        functionName: "getSpend",
        args: [groupId, spendId],
      })) as unknown as [Address, Address, bigint, bigint, number, Hex];

      return {
        spender: result[0],
        to: result[1],
        amount: BigInt(result[2]),
        executedAt: Number(result[3]),
        status: Number(result[4]),
        noteHash: result[5],
      };
    },

    async simulateSettle(groupId) {
      try {
        await publicClient.simulateContract({
          ...contract,
          account: wallets.settler.account,
          functionName: "settle",
          args: [groupId],
        });
        return { ok: true };
      } catch (error) {
        const reason = errorMessage(error);
        return {
          ok: false,
          alreadySettled: SETTLED_PATTERNS.some((pattern) => pattern.test(reason)),
          reason,
        };
      }
    },

    async sendSettle(groupId) {
      // One mutex per wallet keeps the settler's nonce strictly ordered.
      return wallets.settler.mutex.run(async () => {
        const { request } = await publicClient.simulateContract({
          ...contract,
          account: wallets.settler.account,
          functionName: "settle",
          args: [groupId],
        });
        // Monad bills gas by gas limit, so buffer the estimate by ~20% and no more.
        const gas = request.gas !== undefined ? (request.gas * 12n) / 10n : undefined;
        const hash = await wallets.settler.client.writeContract({
          ...request,
          gas,
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 30_000,
        });
        return { hash, ok: receipt.status === "success" };
      });
    },

    async sendDrip(to, amountWei) {
      return wallets.drip.mutex.run(async () => {
        const hash = await wallets.drip.client.sendTransaction({
          account: wallets.drip.account,
          to,
          value: amountWei,
        });
        // Wait for the receipt so the user's very first transaction cannot fail
        // because the funds have not landed yet.
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 20_000,
        });
        if (receipt.status !== "success") {
          throw new Error("drip transaction reverted");
        }
        logger.debug({ txHash: hash, to }, "drip confirmed");
        return hash;
      });
    },
  };
}

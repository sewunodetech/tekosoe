import { BaseError, ContractFunctionRevertedError, type Address, type Hash, type Hex } from "viem";
import { groupVaultAbi } from "@tekosoe/shared";
import type { Env } from "../config/env";
import type { Logger } from "../lib/logger";
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

/** Custom error name of a contract revert (decoded through the ABI), if any. */
export function revertErrorName(error: unknown): string | undefined {
  if (!(error instanceof BaseError)) return undefined;
  const reverted = error.walk((err) => err instanceof ContractFunctionRevertedError);
  return reverted instanceof ContractFunctionRevertedError ? reverted.data?.errorName : undefined;
}

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
      // The contract returns one `Group` struct; viem decodes a single tuple output as an object.
      const group = await publicClient.readContract({
        ...contract,
        functionName: "getGroup",
        args: [groupId],
      });

      return {
        name: group.name,
        creator: group.creator,
        inviteHash: group.inviteHash,
        endsAt: Number(group.endsAt),
        disputeWindow: Number(group.disputeWindow),
        approvalThreshold: group.approvalThreshold,
        pool: group.pool,
        status: group.status,
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
      const spend = await publicClient.readContract({
        ...contract,
        functionName: "getSpend",
        args: [groupId, spendId],
      });

      return {
        spender: spend.spender,
        to: spend.to,
        amount: spend.amount,
        executedAt: Number(spend.executedAt),
        status: spend.status,
        noteHash: spend.noteHash,
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
        // GroupNotActive = someone (a member, the admin trigger) already settled this group.
        return {
          ok: false,
          alreadySettled: revertErrorName(error) === "GroupNotActive",
          reason: errorMessage(error),
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

import {
  BaseError,
  ContractFunctionRevertedError,
  parseEventLogs,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { groupVaultAbi } from "@tekosue/shared";
import type { Env } from "../config/env";
import type { Logger } from "../lib/logger";
import { createPublicChainClient, type PublicClient } from "./clients";
import { createWallets, type Wallets } from "./wallets";

export interface GroupView {
  name: string;
  creator: Address;
  inviteKey: Address;
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

/** What one settle transaction did, per member (lowercase address). Source for invoices. */
export interface SettleOutcome {
  txHash: Hash;
  groupId: bigint;
  pulled: Map<string, { amount: bigint; remainingDebt: bigint }>;
  refunded: Map<string, { amount: bigint; remainingCredit: bigint }>;
}

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
  /** Decodes Settled/Pulled/Refunded from a settle receipt; null when it holds no Settled for the group. */
  getSettleOutcome(groupId: bigint, txHash: Hash): Promise<SettleOutcome | null>;
  sendDrip(to: Address, amountWei: bigint): Promise<Hash>;
}

/** Custom error name of a contract revert (decoded through the ABI), if any. */
export function revertErrorName(error: unknown): string | undefined {
  if (!(error instanceof BaseError)) return undefined;
  const reverted = error.walk((err) => err instanceof ContractFunctionRevertedError);
  return reverted instanceof ContractFunctionRevertedError ? reverted.data?.errorName : undefined;
}

/** Pure part of getSettleOutcome, exported for tests. `logs` must come from the GroupVault. */
export function settleOutcomeFromLogs(
  groupId: bigint,
  txHash: Hash,
  logs: Parameters<typeof parseEventLogs>[0]["logs"],
): SettleOutcome | null {
  const events = parseEventLogs({
    abi: groupVaultAbi,
    logs,
    eventName: ["Settled", "Pulled", "Refunded"],
  }).filter((event) => event.args.groupId === groupId);

  if (!events.some((event) => event.eventName === "Settled")) return null;

  const outcome: SettleOutcome = { txHash, groupId, pulled: new Map(), refunded: new Map() };
  for (const event of events) {
    if (event.eventName === "Pulled") {
      outcome.pulled.set(event.args.member.toLowerCase(), {
        amount: event.args.amount,
        remainingDebt: event.args.remainingDebt,
      });
    } else if (event.eventName === "Refunded") {
      outcome.refunded.set(event.args.member.toLowerCase(), {
        amount: event.args.amount,
        remainingCredit: event.args.remainingCredit,
      });
    }
  }
  return outcome;
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
        inviteKey: group.inviteKey,
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

    async getSettleOutcome(groupId, txHash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") return null;
      const logs = receipt.logs.filter(
        (log) => log.address.toLowerCase() === address.toLowerCase(),
      );
      return settleOutcomeFromLogs(groupId, txHash, logs);
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

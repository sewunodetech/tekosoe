import type { Express } from "express";
import { SignJWT } from "jose";
import type { Address, Hash } from "viem";
import { GROUP_STATUS } from "@tekosoe/shared";
import { createApp, createRouteContext } from "../../src/app";
import type {
  ChainService,
  GroupView,
  SettleOutcome,
  SimulateResult,
  SpendView,
} from "../../src/chain/groupVault";
import { loadEnv, type Env } from "../../src/config/env";
import type { AppDeps, RouteContext } from "../../src/context";
import type {
  AuthNonceRow,
  GasDripRow,
  GroupKeyWrapRow,
  GroupMetaRow,
  InvoiceRow,
  MemberEncKeyRow,
  ProfileRow,
  PushSubRow,
  ReceiptRow,
  Repos,
  SettleRunRow,
  SpendMetaRow,
  SpendReviewRow,
} from "../../src/db/repos";
import type { StorageService } from "../../src/integrations/storage";
import type { DueGroup, EnvioClient } from "../../src/integrations/envio";
import type { PushMessage, PushResult, PushService } from "../../src/integrations/expoPush";
import { createSilentLogger } from "../../src/lib/logger";
import { createSchedulerState } from "../../src/modules/settle/state";

export const TEST_ADMIN_KEY = "test-admin-key";
export const TEST_ADDRESS = "0x1111111111111111111111111111111111111111";
export const OTHER_ADDRESS = "0x2222222222222222222222222222222222222222";
export const THIRD_ADDRESS = "0x3333333333333333333333333333333333333333";
export const GROUP_VAULT_ADDRESS = "0x9999999999999999999999999999999999999999";

export function testEnv(overrides: Record<string, string> = {}): Env {
  return loadEnv({
    NODE_ENV: "test",
    PORT: "3000",
    ADMIN_API_KEY: TEST_ADMIN_KEY,
    CHAIN_ID: "10143",
    MONAD_TESTNET_RPC_URL: "https://rpc.test.invalid",
    GROUP_VAULT_ADDRESS,
    ENVIO_GRAPHQL_URL: "https://envio.test.invalid/v1/graphql",
    DRIP_PRIVATE_KEY: `0x${"11".repeat(32)}`,
    SETTLER_PRIVATE_KEY: `0x${"22".repeat(32)}`,
    LOW_BALANCE_THRESHOLD_MON: "0.5",
    DRIP_AMOUNT_MON: "0.05",
    DRIP_MIN_BALANCE_MON: "0.01",
    DRIP_RATE_LIMIT_PER_HOUR: "50",
    DRIP_DAILY_CAP: "200",
    SETTLE_INTERVAL_MS: "30000",
    SETTLE_ALERT_ATTEMPTS: "8",
    DATABASE_URL: "postgres://user:pass@localhost:5432/test",
    DATABASE_URL_UNPOOLED: "postgres://user:pass@localhost:5432/test",
    AUTH_DOMAIN: "app.test.invalid",
    AUTH_JWT_SECRET: "test-jwt-secret-with-at-least-32-characters",
    AUTH_TOKEN_TTL_SECONDS: "3600",
    FEATURE_RECEIPTS: "true",
    S3_ENDPOINT: "https://s3.test.invalid",
    S3_REGION: "us-east-1",
    S3_BUCKET: "test-bucket",
    S3_ACCESS_KEY_ID: "test-access",
    S3_SECRET_ACCESS_KEY: "test-secret",
    FEATURE_PUSH: "true",
    ALCHEMY_WEBHOOK_SIGNING_KEY: "test-signing-key",
    ...overrides,
  });
}

/* ------------------------------------------------------------------ repos */

export function createFakeRepos(): Repos {
  const gasDrips = new Map<string, GasDripRow>();
  const settleRuns = new Map<number, SettleRunRow>();
  const nonces = new Map<string, AuthNonceRow>();
  const profileRows = new Map<string, ProfileRow>();
  const groupMetaRows = new Map<number, GroupMetaRow>();
  const spendMetaRows = new Map<string, SpendMetaRow>();
  const reviewRows = new Map<string, SpendReviewRow>();
  const receiptRows = new Map<string, ReceiptRow>();
  const invoiceRows = new Map<string, InvoiceRow>();
  const encKeys = new Map<string, MemberEncKeyRow>();
  const wraps = new Map<string, GroupKeyWrapRow>();
  const pushRows = new Map<string, PushSubRow>();
  const processed = new Set<string>();
  const kv = new Map<string, string>();
  let receiptSeq = 0;

  return {
    gasDrips: {
      async get(address) {
        return gasDrips.get(address) ?? null;
      },
      async claim(address, amountWei) {
        if (gasDrips.has(address)) return false;
        gasDrips.set(address, {
          address,
          status: "pending",
          txHash: null,
          amountWei: amountWei.toString(),
          createdAt: new Date(),
        });
        return true;
      },
      async confirm(address, txHash) {
        const row = gasDrips.get(address);
        if (row) gasDrips.set(address, { ...row, status: "confirmed", txHash });
      },
      async release(address) {
        gasDrips.delete(address);
      },
      async countSince(since) {
        let count = 0;
        for (const row of gasDrips.values()) {
          if (row.createdAt >= since) count += 1;
        }
        return count;
      },
    },

    settleRuns: {
      async get(groupId) {
        return settleRuns.get(groupId) ?? null;
      },
      async upsert(run) {
        // Mirrors the drizzle upsert: every column is written on each call.
        settleRuns.set(run.groupId, {
          groupId: run.groupId,
          status: run.status,
          txHash: run.txHash ?? null,
          attempts: run.attempts ?? 0,
          nextAttemptAt: run.nextAttemptAt ?? null,
          lastError: run.lastError ?? null,
          updatedAt: new Date(),
        });
      },
      async listRecent(limit) {
        return [...settleRuns.values()]
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, limit);
      },
    },

    authNonces: {
      async create(nonce) {
        nonces.set(nonce.nonce, { ...nonce, usedAt: null });
      },
      async getLatestValid(address, now) {
        const valid = [...nonces.values()]
          .filter((row) => row.address === address && !row.usedAt && row.expiresAt > now)
          .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime());
        return valid[0] ?? null;
      },
      async markUsed(nonce, at) {
        const row = nonces.get(nonce);
        if (!row || row.usedAt) return false;
        nonces.set(nonce, { ...row, usedAt: at });
        return true;
      },
      async deleteExpired(now) {
        let removed = 0;
        for (const [key, row] of nonces) {
          if (row.expiresAt < now) {
            nonces.delete(key);
            removed += 1;
          }
        }
        return removed;
      },
    },

    profiles: {
      async get(address) {
        return profileRows.get(address) ?? null;
      },
      async upsert(profile) {
        const row: ProfileRow = { ...profile, updatedAt: new Date() };
        profileRows.set(profile.address, row);
        return row;
      },
      async list(addresses) {
        return addresses
          .map((address) => profileRows.get(address))
          .filter((row): row is ProfileRow => row !== undefined);
      },
    },

    groupMeta: {
      async get(groupId) {
        return groupMetaRows.get(groupId) ?? null;
      },
      async insert(row) {
        if (groupMetaRows.has(row.groupId)) return false;
        groupMetaRows.set(row.groupId, { ...row, createdAt: new Date() });
        return true;
      },
    },

    spendMeta: {
      async get(groupId, spendId) {
        return spendMetaRows.get(`${groupId}:${spendId}`) ?? null;
      },
      async insert(row) {
        const key = `${row.groupId}:${row.spendId}`;
        if (spendMetaRows.has(key)) return false;
        spendMetaRows.set(key, { ...row, createdAt: new Date() });
        return true;
      },
      async listByGroup(groupId) {
        return [...spendMetaRows.values()]
          .filter((row) => row.groupId === groupId)
          .sort((a, b) => b.spendId - a.spendId);
      },
    },

    spendReviews: {
      async upsert({ groupId, spendId, member, seen, decisionNote }) {
        const key = `${groupId}:${spendId}:${member}`;
        const existing = reviewRows.get(key);
        const row: SpendReviewRow = {
          groupId,
          spendId,
          member,
          seenAt: existing?.seenAt ?? (seen ? new Date() : null),
          decisionNote: decisionNote !== undefined ? decisionNote : (existing?.decisionNote ?? null),
        };
        reviewRows.set(key, row);
        return row;
      },
      async listByGroup(groupId) {
        return [...reviewRows.values()].filter((row) => row.groupId === groupId);
      },
    },

    receipts: {
      async create(receipt) {
        receiptSeq += 1;
        const row: ReceiptRow = {
          ...receipt,
          id: `receipt-${receiptSeq}`,
          createdAt: new Date(),
        };
        receiptRows.set(row.id, row);
        return row;
      },
      async get(id) {
        return receiptRows.get(id) ?? null;
      },
      async getByHash(receiptHash) {
        for (const row of receiptRows.values()) {
          if (row.receiptHash === receiptHash && row.status === "ready") return row;
        }
        return null;
      },
      async markReady(id, receiptHash, sizeBytes) {
        const row = receiptRows.get(id);
        if (row) receiptRows.set(id, { ...row, status: "ready", receiptHash, sizeBytes });
      },
      async remove(id) {
        receiptRows.delete(id);
      },
      async listByGroup(groupId) {
        return [...receiptRows.values()]
          .filter((row) => row.groupId === groupId && row.status === "ready")
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      async listStalePending(before) {
        return [...receiptRows.values()].filter(
          (row) => row.status === "pending" && row.createdAt < before,
        );
      },
    },

    invoices: {
      async insertMany(rows) {
        let created = 0;
        for (const row of rows) {
          const key = `${row.groupId}:${row.member}`;
          const numberTaken = [...invoiceRows.values()].some((r) => r.number === row.number);
          if (invoiceRows.has(key) || numberTaken) continue;
          invoiceRows.set(key, { ...row, debtPaid: "0", issuedAt: new Date() });
          created += 1;
        }
        return created;
      },
      async countByGroup(groupId) {
        return [...invoiceRows.values()].filter((row) => row.groupId === groupId).length;
      },
      async get(groupId, member) {
        return invoiceRows.get(`${groupId}:${member}`) ?? null;
      },
      async getByNumber(number) {
        return [...invoiceRows.values()].find((row) => row.number === number) ?? null;
      },
      async recordDebtPaid(groupId, member, amount) {
        const key = `${groupId}:${member}`;
        const row = invoiceRows.get(key);
        if (!row) return null;
        const debtPaid = BigInt(row.debtPaid) + amount;
        const status =
          row.status === "due" && debtPaid >= BigInt(row.remainingDebt) ? "paid" : row.status;
        const next = { ...row, debtPaid: debtPaid.toString(), status };
        invoiceRows.set(key, next);
        return next;
      },
    },

    pushSubs: {
      async upsert(sub) {
        pushRows.set(`${sub.address}:${sub.expoPushToken}`, { ...sub, createdAt: new Date() });
      },
      async deleteToken(expoPushToken, address) {
        for (const [key, row] of pushRows) {
          if (row.expoPushToken === expoPushToken && (!address || row.address === address)) {
            pushRows.delete(key);
          }
        }
      },
      async listByAddresses(addresses) {
        const wanted = new Set(addresses);
        return [...pushRows.values()].filter((row) => wanted.has(row.address));
      },
    },

    memberEncKeys: {
      async get(address) {
        return encKeys.get(address) ?? null;
      },
      async listByAddresses(addresses) {
        return addresses
          .map((address) => encKeys.get(address))
          .filter((row): row is MemberEncKeyRow => row !== undefined);
      },
      async upsert(address, encPublicKey) {
        encKeys.set(address, { address, encPublicKey, updatedAt: new Date() });
      },
    },

    groupKeyWraps: {
      async insertMany(rows) {
        let created = 0;
        for (const wrap of rows) {
          const key = `${wrap.groupId}:${wrap.memberAddress}`;
          if (wraps.has(key)) continue;
          wraps.set(key, { ...wrap, createdAt: new Date() });
          created += 1;
        }
        return created;
      },
      async get(groupId, memberAddress) {
        return wraps.get(`${groupId}:${memberAddress}`) ?? null;
      },
    },

    processedEvents: {
      async insertIfNew(txHash, logIndex) {
        const key = `${txHash}:${logIndex}`;
        if (processed.has(key)) return false;
        processed.add(key);
        return true;
      },
    },

    kvState: {
      async get(key) {
        return kv.get(key) ?? null;
      },
      async set(key, value) {
        kv.set(key, value);
      },
    },
  };
}

/* ------------------------------------------------------------------ chain */

export const FAKE_DRIP_ADDRESS = "0xaaaa000000000000000000000000000000000001" as Address;
export const FAKE_SETTLER_ADDRESS = "0xaaaa000000000000000000000000000000000002" as Address;
export const FAKE_SETTLE_TX = `0x${"5e".repeat(32)}` as Hash;

export function defaultGroup(overrides: Partial<GroupView> = {}): GroupView {
  return {
    name: "Trip to Bali",
    creator: TEST_ADDRESS as Address,
    inviteHash: `0x${"00".repeat(32)}` as GroupView["inviteHash"],
    endsAt: 1_700_000_000,
    disputeWindow: 3_600,
    approvalThreshold: 0n,
    pool: 0n,
    status: GROUP_STATUS.Active,
    ...overrides,
  };
}

/** TEST_ADDRESS paid in $10 short, OTHER_ADDRESS got $10 back. */
export function defaultSettleOutcome(groupId: bigint, txHash: Hash = FAKE_SETTLE_TX): SettleOutcome {
  return {
    txHash,
    groupId,
    pulled: new Map([[TEST_ADDRESS, { amount: 10_000_000n, remainingDebt: 0n }]]),
    refunded: new Map([[OTHER_ADDRESS, { amount: 10_000_000n, remainingCredit: 0n }]]),
  };
}

export function createFakeChain(overrides: Partial<ChainService> = {}): ChainService {
  const base: ChainService = {
    dripAddress: FAKE_DRIP_ADDRESS,
    settlerAddress: FAKE_SETTLER_ADDRESS,
    async getChainId() {
      return 10143;
    },
    async getLatestBlockTimestamp() {
      return 1_800_000_000;
    },
    async hasContractCode() {
      return true;
    },
    async getNativeBalance() {
      return 0n;
    },
    async getGroup() {
      return defaultGroup();
    },
    async membersOf() {
      return [TEST_ADDRESS as Address, OTHER_ADDRESS as Address];
    },
    async getSpend(): Promise<SpendView> {
      return {
        spender: TEST_ADDRESS as Address,
        to: OTHER_ADDRESS as Address,
        amount: 1_500_000n,
        executedAt: 0,
        status: 1,
        noteHash: `0x${"00".repeat(32)}` as SpendView["noteHash"],
      };
    },
    async simulateSettle(): Promise<SimulateResult> {
      return { ok: true };
    },
    async sendSettle() {
      return { hash: FAKE_SETTLE_TX, ok: true };
    },
    async getSettleOutcome(groupId, txHash) {
      return defaultSettleOutcome(groupId, txHash);
    },
    async sendDrip() {
      return "0xdriphash" as Hash;
    },
  };
  return { ...base, ...overrides };
}

/* ----------------------------------------------------------------- envio */

export interface FakeEnvio extends EnvioClient {
  groups: DueGroup[];
  failNext: boolean;
  settleTxs: Map<string, string>;
}

export function createFakeEnvio(groups: DueGroup[] = []): FakeEnvio {
  const state = { groups: [...groups], failNext: false };
  const settleTxs = new Map<string, string>();
  return {
    settleTxs,
    get groups() {
      return state.groups;
    },
    set groups(next: DueGroup[]) {
      state.groups = next;
    },
    get failNext() {
      return state.failNext;
    },
    set failNext(value: boolean) {
      state.failNext = value;
    },
    async dueGroups(now, limit, offset) {
      if (state.failNext) throw new Error("indexer unavailable");
      return state.groups.filter((group) => group.endsAt <= now).slice(offset, offset + limit);
    },
    async settleTxHash(groupId) {
      return settleTxs.get(groupId) ?? null;
    },
    async ping() {
      return !state.failNext;
    },
  };
}

/* --------------------------------------------------------------- storage */

export interface FakeStorage extends StorageService {
  objects: Map<string, Uint8Array>;
}

export function createFakeStorage(): FakeStorage {
  const objects = new Map<string, Uint8Array>();
  return {
    objects,
    async presignPut(key, options) {
      return {
        url: `https://storage.test/${key}?upload=1`,
        headers: { "Content-Type": options.contentType },
      };
    },
    async presignGet(key) {
      return `https://storage.test/${key}?download=1`;
    },
    async head(key) {
      const bytes = objects.get(key);
      return bytes ? { contentLength: bytes.length } : null;
    },
    async getBytes(key) {
      return objects.get(key) ?? null;
    },
    async remove(key) {
      objects.delete(key);
    },
  };
}

/* ------------------------------------------------------------------ push */

export interface FakePush extends PushService {
  sent: PushMessage[];
  /** Result per Expo token; defaults to "sent". */
  results: Map<string, PushResult>;
}

export function createFakePush(): FakePush {
  const sent: PushMessage[] = [];
  const results = new Map<string, PushResult>();
  return {
    sent,
    results,
    async sendMany(messages) {
      sent.push(...messages);
      return messages.map((message) => results.get(message.to) ?? "sent");
    },
  };
}

/* ------------------------------------------------------------------- app */

export interface BuiltApp {
  app: Express;
  ctx: RouteContext;
  deps: AppDeps;
  env: Env;
  repos: Repos;
  chain: ChainService;
  envio: FakeEnvio;
  storage: FakeStorage;
  push: FakePush;
}

export function makeApp(overrides: Partial<AppDeps> = {}): BuiltApp {
  const env = overrides.env ?? testEnv();
  const repos = overrides.repos ?? createFakeRepos();
  const chain = overrides.chain ?? createFakeChain();
  const envio = (overrides.envio as FakeEnvio) ?? createFakeEnvio();
  const storage = (overrides.storage as FakeStorage) ?? createFakeStorage();
  const push = (overrides.push as FakePush) ?? createFakePush();

  const deps: AppDeps = {
    env,
    logger: overrides.logger ?? createSilentLogger(),
    repos,
    chain,
    envio,
    storage,
    push,
    scheduler: overrides.scheduler ?? createSchedulerState(),
    pingDb: overrides.pingDb ?? (async () => ({ ok: true, latencyMs: 1 })),
    onWebhookWork: overrides.onWebhookWork,
  };

  const ctx = createRouteContext(deps);
  return { app: createApp(ctx), ctx, deps, env, repos, chain, envio, storage, push };
}

/* ------------------------------------------------------------------ auth */

export async function mintToken(address: string, env: Env = testEnv()): Promise<string> {
  const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(address.toLowerCase())
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

export async function authHeader(
  address: string,
  env: Env = testEnv(),
): Promise<Record<string, string>> {
  return { authorization: `Bearer ${await mintToken(address, env)}` };
}

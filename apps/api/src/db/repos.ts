import { desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { Db } from "./client";
import * as schema from "./schema";
import type { GasDripStatus, ReceiptStatus, SettleRunStatus } from "./schema";

/** Row shapes mirror schema.ts. Addresses are always lowercase strings. */

export type { GasDripStatus, ReceiptStatus, SettleRunStatus };

export interface GasDripRow {
  address: string;
  status: GasDripStatus;
  txHash: string | null;
  amountWei: string | null;
  createdAt: Date;
}

export interface SettleRunRow {
  groupId: number;
  status: SettleRunStatus;
  txHash: string | null;
  attempts: number;
  nextAttemptAt: Date | null;
  lastError: string | null;
  updatedAt: Date;
}

export interface SettleRunUpsert {
  groupId: number;
  status: SettleRunStatus;
  txHash?: string | null;
  attempts?: number;
  nextAttemptAt?: Date | null;
  lastError?: string | null;
}

export interface AuthNonceRow {
  nonce: string;
  address: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface ProfileRow {
  address: string;
  displayName: string;
  avatar: string | null;
  updatedAt: Date;
}

export interface ReceiptRow {
  id: string;
  groupId: number;
  uploaderAddress: string;
  storageKey: string;
  noteHash: string | null;
  sizeBytes: number;
  status: ReceiptStatus;
  createdAt: Date;
}

export interface MemberEncKeyRow {
  address: string;
  encPublicKey: string;
  updatedAt: Date;
}

export interface GroupKeyWrapRow {
  groupId: number;
  memberAddress: string;
  wrappedKey: string;
  wrappedBy: string;
  createdAt: Date;
}

export interface PushSubscriptionRow {
  id: string;
  address: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

export interface GasDripRepo {
  get(address: string): Promise<GasDripRow | null>;
  /** INSERT .. ON CONFLICT DO NOTHING — returns false when another request claimed it. */
  claim(address: string, amountWei: bigint): Promise<boolean>;
  confirm(address: string, txHash: string): Promise<void>;
  /** Release a pending claim after a failed send so the address can retry. */
  release(address: string): Promise<void>;
  countSince(since: Date): Promise<number>;
}

export interface SettleRunRepo {
  get(groupId: number): Promise<SettleRunRow | null>;
  upsert(run: SettleRunUpsert): Promise<void>;
  listRecent(limit: number): Promise<SettleRunRow[]>;
}

export interface AuthNonceRepo {
  create(nonce: { nonce: string; address: string; expiresAt: Date }): Promise<void>;
  /** Newest unused, unexpired challenge for the address. */
  getLatestValid(address: string, now: Date): Promise<AuthNonceRow | null>;
  /** Conditional update — returns false when the nonce was already consumed. */
  markUsed(nonce: string, at: Date): Promise<boolean>;
  deleteExpired(now: Date): Promise<number>;
}

export interface ProfileRepo {
  get(address: string): Promise<ProfileRow | null>;
  upsert(profile: Omit<ProfileRow, "updatedAt">): Promise<ProfileRow>;
  list(addresses: string[]): Promise<ProfileRow[]>;
}

export interface ReceiptRepo {
  create(receipt: Omit<ReceiptRow, "id" | "createdAt">): Promise<ReceiptRow>;
  get(id: string): Promise<ReceiptRow | null>;
  getByNoteHash(noteHash: string): Promise<ReceiptRow | null>;
  markReady(id: string, noteHash: string, sizeBytes: number): Promise<void>;
  remove(id: string): Promise<void>;
  listByGroup(groupId: number): Promise<ReceiptRow[]>;
  listStalePending(before: Date): Promise<ReceiptRow[]>;
}

export interface MemberEncKeyRepo {
  get(address: string): Promise<MemberEncKeyRow | null>;
  listByAddresses(addresses: string[]): Promise<MemberEncKeyRow[]>;
  upsert(address: string, encPublicKey: string): Promise<void>;
}

export interface GroupKeyWrapRepo {
  /** Insert-only: existing (groupId, member) pairs are never overwritten. */
  insertMany(wraps: Omit<GroupKeyWrapRow, "createdAt">[]): Promise<number>;
  get(groupId: number, memberAddress: string): Promise<GroupKeyWrapRow | null>;
}

export interface PushSubscriptionRepo {
  upsert(sub: Omit<PushSubscriptionRow, "id" | "createdAt">): Promise<void>;
  deleteByEndpoint(endpoint: string): Promise<void>;
  listByAddresses(addresses: string[]): Promise<PushSubscriptionRow[]>;
}

export interface ProcessedEventRepo {
  /** Returns false when the event was already recorded (Alchemy can redeliver). */
  insertIfNew(txHash: string, logIndex: number): Promise<boolean>;
}

export interface KvRepo {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export interface Repos {
  gasDrips: GasDripRepo;
  settleRuns: SettleRunRepo;
  authNonces: AuthNonceRepo;
  profiles: ProfileRepo;
  receipts: ReceiptRepo;
  memberEncKeys: MemberEncKeyRepo;
  groupKeyWraps: GroupKeyWrapRepo;
  pushSubscriptions: PushSubscriptionRepo;
  processedEvents: ProcessedEventRepo;
  kvState: KvRepo;
}

export function createRepos(db: Db): Repos {
  return {
    gasDrips: {
      async get(address) {
        const rows = await db
          .select()
          .from(schema.gasDrips)
          .where(eq(schema.gasDrips.address, address))
          .limit(1);
        return rows[0] ?? null;
      },
      async claim(address, amountWei) {
        const rows = await db
          .insert(schema.gasDrips)
          .values({
            address,
            status: "pending",
            amountWei: amountWei.toString(),
          })
          .onConflictDoNothing({ target: schema.gasDrips.address })
          .returning({ address: schema.gasDrips.address });
        return rows.length > 0;
      },
      async confirm(address, txHash) {
        await db
          .update(schema.gasDrips)
          .set({ status: "confirmed", txHash })
          .where(eq(schema.gasDrips.address, address));
      },
      async release(address) {
        await db
          .delete(schema.gasDrips)
          .where(eq(schema.gasDrips.address, address));
      },
      async countSince(since) {
        const rows = await db
          .select({ value: sql<string>`count(*)::int` })
          .from(schema.gasDrips)
          .where(gte(schema.gasDrips.createdAt, since));
        return Number(rows[0]?.value ?? 0);
      },
    },

    settleRuns: {
      async get(groupId) {
        const rows = await db
          .select()
          .from(schema.settleRuns)
          .where(eq(schema.settleRuns.groupId, groupId))
          .limit(1);
        return rows[0] ?? null;
      },
      async upsert(run) {
        await db
          .insert(schema.settleRuns)
          .values({
            groupId: run.groupId,
            status: run.status,
            txHash: run.txHash ?? null,
            attempts: run.attempts ?? 0,
            nextAttemptAt: run.nextAttemptAt ?? null,
            lastError: run.lastError ?? null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.settleRuns.groupId,
            set: {
              status: run.status,
              txHash: run.txHash ?? null,
              attempts: run.attempts ?? 0,
              nextAttemptAt: run.nextAttemptAt ?? null,
              lastError: run.lastError ?? null,
              updatedAt: new Date(),
            },
          });
      },
      async listRecent(limit) {
        return db
          .select()
          .from(schema.settleRuns)
          .orderBy(desc(schema.settleRuns.updatedAt))
          .limit(limit);
      },
    },

    authNonces: {
      async create({ nonce, address, expiresAt }) {
        await db.insert(schema.authNonces).values({ nonce, address, expiresAt });
      },
      async getLatestValid(address, now) {
        const rows = await db
          .select()
          .from(schema.authNonces)
          .where(
            sql`${schema.authNonces.address} = ${address}
                and ${schema.authNonces.usedAt} is null
                and ${schema.authNonces.expiresAt} > ${now}`,
          )
          .orderBy(desc(schema.authNonces.expiresAt))
          .limit(1);
        return rows[0] ?? null;
      },
      async markUsed(nonce, at) {
        const rows = await db
          .update(schema.authNonces)
          .set({ usedAt: at })
          .where(sql`${schema.authNonces.nonce} = ${nonce} and ${schema.authNonces.usedAt} is null`)
          .returning({ nonce: schema.authNonces.nonce });
        return rows.length > 0;
      },
      async deleteExpired(now) {
        const rows = await db
          .delete(schema.authNonces)
          .where(lt(schema.authNonces.expiresAt, now))
          .returning({ nonce: schema.authNonces.nonce });
        return rows.length;
      },
    },

    profiles: {
      async get(address) {
        const rows = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.address, address))
          .limit(1);
        return rows[0] ?? null;
      },
      async upsert(profile) {
        const rows = await db
          .insert(schema.profiles)
          .values({ ...profile, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: schema.profiles.address,
            set: {
              displayName: profile.displayName,
              avatar: profile.avatar,
              updatedAt: new Date(),
            },
          })
          .returning();
        return rows[0]!;
      },
      async list(addresses) {
        if (addresses.length === 0) return [];
        return db
          .select()
          .from(schema.profiles)
          .where(inArray(schema.profiles.address, addresses));
      },
    },

    receipts: {
      async create(receipt) {
        const rows = await db
          .insert(schema.receipts)
          .values(receipt)
          .returning();
        return rows[0]!;
      },
      async get(id) {
        const rows = await db
          .select()
          .from(schema.receipts)
          .where(eq(schema.receipts.id, id))
          .limit(1);
        return rows[0] ?? null;
      },
      async getByNoteHash(noteHash) {
        const rows = await db
          .select()
          .from(schema.receipts)
          .where(sql`${schema.receipts.noteHash} = ${noteHash} and ${schema.receipts.status} = 'ready'`)
          .limit(1);
        return rows[0] ?? null;
      },
      async markReady(id, noteHash, sizeBytes) {
        await db
          .update(schema.receipts)
          .set({ status: "ready", noteHash, sizeBytes })
          .where(eq(schema.receipts.id, id));
      },
      async remove(id) {
        await db.delete(schema.receipts).where(eq(schema.receipts.id, id));
      },
      async listByGroup(groupId) {
        return db
          .select()
          .from(schema.receipts)
          .where(sql`${schema.receipts.groupId} = ${groupId} and ${schema.receipts.status} = 'ready'`)
          .orderBy(desc(schema.receipts.createdAt));
      },
      async listStalePending(before) {
        return db
          .select()
          .from(schema.receipts)
          .where(sql`${schema.receipts.status} = 'pending' and ${schema.receipts.createdAt} < ${before}`);
      },
    },

    memberEncKeys: {
      async get(address) {
        const rows = await db
          .select()
          .from(schema.memberEncKeys)
          .where(eq(schema.memberEncKeys.address, address))
          .limit(1);
        return rows[0] ?? null;
      },
      async listByAddresses(addresses) {
        if (addresses.length === 0) return [];
        return db
          .select()
          .from(schema.memberEncKeys)
          .where(inArray(schema.memberEncKeys.address, addresses));
      },
      async upsert(address, encPublicKey) {
        await db
          .insert(schema.memberEncKeys)
          .values({ address, encPublicKey, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: schema.memberEncKeys.address,
            set: { encPublicKey, updatedAt: new Date() },
          });
      },
    },

    groupKeyWraps: {
      async insertMany(wraps) {
        if (wraps.length === 0) return 0;
        const rows = await db
          .insert(schema.groupKeyWraps)
          .values(wraps)
          .onConflictDoNothing()
          .returning({ memberAddress: schema.groupKeyWraps.memberAddress });
        return rows.length;
      },
      async get(groupId, memberAddress) {
        const rows = await db
          .select()
          .from(schema.groupKeyWraps)
          .where(
            sql`${schema.groupKeyWraps.groupId} = ${groupId} and ${schema.groupKeyWraps.memberAddress} = ${memberAddress}`,
          )
          .limit(1);
        return rows[0] ?? null;
      },
    },

    pushSubscriptions: {
      async upsert(sub) {
        await db
          .insert(schema.pushSubscriptions)
          .values({ ...sub, id: crypto.randomUUID() })
          .onConflictDoUpdate({
            target: schema.pushSubscriptions.endpoint,
            set: { address: sub.address, p256dh: sub.p256dh, auth: sub.auth },
          });
      },
      async deleteByEndpoint(endpoint) {
        await db
          .delete(schema.pushSubscriptions)
          .where(eq(schema.pushSubscriptions.endpoint, endpoint));
      },
      async listByAddresses(addresses) {
        if (addresses.length === 0) return [];
        return db
          .select()
          .from(schema.pushSubscriptions)
          .where(inArray(schema.pushSubscriptions.address, addresses));
      },
    },

    processedEvents: {
      async insertIfNew(txHash, logIndex) {
        const rows = await db
          .insert(schema.processedEvents)
          .values({ txHash, logIndex })
          .onConflictDoNothing()
          .returning({ txHash: schema.processedEvents.txHash });
        return rows.length > 0;
      },
    },

    kvState: {
      async get(key) {
        const rows = await db
          .select()
          .from(schema.kvState)
          .where(eq(schema.kvState.key, key))
          .limit(1);
        return rows[0]?.value ?? null;
      },
      async set(key, value) {
        await db
          .insert(schema.kvState)
          .values({ key, value })
          .onConflictDoUpdate({ target: schema.kvState.key, set: { value } });
      },
    },
  };
}

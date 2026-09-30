import { and, desc, eq, gt, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import type { Db } from "./client";
import * as schema from "./schema";
import type {
  GasDripStatus,
  InvoiceStatus,
  PushPlatform,
  ReceiptStatus,
  SettleRunStatus,
} from "./schema";

/** Row shapes come straight from schema.ts. Addresses are always lowercase strings. */

export type { GasDripStatus, InvoiceStatus, PushPlatform, ReceiptStatus, SettleRunStatus };

export type GasDripRow = typeof schema.gasDrips.$inferSelect;
export type SettleRunRow = typeof schema.settleRuns.$inferSelect;
export type AuthNonceRow = typeof schema.authNonces.$inferSelect;
export type ProfileRow = typeof schema.profiles.$inferSelect;
export type GroupMetaRow = typeof schema.groupMeta.$inferSelect;
export type SpendMetaRow = typeof schema.spendMeta.$inferSelect;
export type SpendReviewRow = typeof schema.spendReviews.$inferSelect;
export type ReceiptRow = typeof schema.receipts.$inferSelect;
export type InvoiceRow = typeof schema.invoices.$inferSelect;
export type PushSubRow = typeof schema.pushSubs.$inferSelect;
export type MemberEncKeyRow = typeof schema.memberEncKeys.$inferSelect;
export type GroupKeyWrapRow = typeof schema.groupKeyWraps.$inferSelect;

export interface SettleRunUpsert {
  groupId: number;
  status: SettleRunStatus;
  txHash?: string | null;
  attempts?: number;
  nextAttemptAt?: Date | null;
  lastError?: string | null;
}

export type NewInvoice = Omit<InvoiceRow, "issuedAt" | "debtPaid">;

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

export interface GroupMetaRepo {
  get(groupId: number): Promise<GroupMetaRow | null>;
  /** Insert-only: returns false when the group already has metadata. */
  insert(row: Omit<GroupMetaRow, "createdAt">): Promise<boolean>;
}

export interface SpendMetaRepo {
  get(groupId: number, spendId: number): Promise<SpendMetaRow | null>;
  /** Insert-only: the content is pinned by noteHash, so a second write can only be identical. */
  insert(row: Omit<SpendMetaRow, "createdAt">): Promise<boolean>;
  listByGroup(groupId: number): Promise<SpendMetaRow[]>;
}

export interface SpendReviewRepo {
  /** Marks the spend as seen (first time only) and/or stores the reviewer's note. */
  upsert(review: {
    groupId: number;
    spendId: number;
    member: string;
    seen: boolean;
    decisionNote?: string | null;
  }): Promise<SpendReviewRow>;
  listByGroup(groupId: number): Promise<SpendReviewRow[]>;
}

export interface ReceiptRepo {
  create(receipt: Omit<ReceiptRow, "id" | "createdAt">): Promise<ReceiptRow>;
  get(id: string): Promise<ReceiptRow | null>;
  getByHash(receiptHash: string): Promise<ReceiptRow | null>;
  markReady(id: string, receiptHash: string, sizeBytes: number): Promise<void>;
  remove(id: string): Promise<void>;
  listByGroup(groupId: number): Promise<ReceiptRow[]>;
  listStalePending(before: Date): Promise<ReceiptRow[]>;
}

export interface InvoiceRepo {
  /** Insert-only (idempotent): returns how many rows were new. */
  insertMany(rows: NewInvoice[]): Promise<number>;
  countByGroup(groupId: number): Promise<number>;
  get(groupId: number, member: string): Promise<InvoiceRow | null>;
  getByNumber(number: string): Promise<InvoiceRow | null>;
  /** Adds a DebtPaid amount; a "due" invoice becomes "paid" once the debt is covered. */
  recordDebtPaid(groupId: number, member: string, amount: bigint): Promise<InvoiceRow | null>;
}

export interface PushSubRepo {
  upsert(sub: { address: string; expoPushToken: string; platform: PushPlatform }): Promise<void>;
  /** Removes the token for this address, or for everyone when address is omitted (dead token). */
  deleteToken(expoPushToken: string, address?: string): Promise<void>;
  listByAddresses(addresses: string[]): Promise<PushSubRow[]>;
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
  groupMeta: GroupMetaRepo;
  spendMeta: SpendMetaRepo;
  spendReviews: SpendReviewRepo;
  receipts: ReceiptRepo;
  invoices: InvoiceRepo;
  pushSubs: PushSubRepo;
  memberEncKeys: MemberEncKeyRepo;
  groupKeyWraps: GroupKeyWrapRepo;
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
        const values = {
          status: run.status,
          txHash: run.txHash ?? null,
          attempts: run.attempts ?? 0,
          nextAttemptAt: run.nextAttemptAt ?? null,
          lastError: run.lastError ?? null,
          updatedAt: new Date(),
        };
        await db
          .insert(schema.settleRuns)
          .values({ groupId: run.groupId, ...values })
          .onConflictDoUpdate({ target: schema.settleRuns.groupId, set: values });
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
            and(
              eq(schema.authNonces.address, address),
              isNull(schema.authNonces.usedAt),
              gt(schema.authNonces.expiresAt, now),
            ),
          )
          .orderBy(desc(schema.authNonces.expiresAt))
          .limit(1);
        return rows[0] ?? null;
      },
      async markUsed(nonce, at) {
        const rows = await db
          .update(schema.authNonces)
          .set({ usedAt: at })
          .where(and(eq(schema.authNonces.nonce, nonce), isNull(schema.authNonces.usedAt)))
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
        const values = {
          displayName: profile.displayName,
          city: profile.city,
          countryCode: profile.countryCode,
          avatarColor: profile.avatarColor,
          updatedAt: new Date(),
        };
        const rows = await db
          .insert(schema.profiles)
          .values({ address: profile.address, ...values })
          .onConflictDoUpdate({ target: schema.profiles.address, set: values })
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

    groupMeta: {
      async get(groupId) {
        const rows = await db
          .select()
          .from(schema.groupMeta)
          .where(eq(schema.groupMeta.groupId, groupId))
          .limit(1);
        return rows[0] ?? null;
      },
      async insert(row) {
        const rows = await db
          .insert(schema.groupMeta)
          .values(row)
          .onConflictDoNothing()
          .returning({ groupId: schema.groupMeta.groupId });
        return rows.length > 0;
      },
    },

    spendMeta: {
      async get(groupId, spendId) {
        const rows = await db
          .select()
          .from(schema.spendMeta)
          .where(and(eq(schema.spendMeta.groupId, groupId), eq(schema.spendMeta.spendId, spendId)))
          .limit(1);
        return rows[0] ?? null;
      },
      async insert(row) {
        const rows = await db
          .insert(schema.spendMeta)
          .values(row)
          .onConflictDoNothing()
          .returning({ spendId: schema.spendMeta.spendId });
        return rows.length > 0;
      },
      async listByGroup(groupId) {
        return db
          .select()
          .from(schema.spendMeta)
          .where(eq(schema.spendMeta.groupId, groupId))
          .orderBy(desc(schema.spendMeta.spendId));
      },
    },

    spendReviews: {
      async upsert({ groupId, spendId, member, seen, decisionNote }) {
        const now = new Date();
        const set: Partial<SpendReviewRow> = {};
        // Keep the first time the member saw it.
        if (seen) set.seenAt = sql`coalesce(${schema.spendReviews.seenAt}, ${now})` as unknown as Date;
        if (decisionNote !== undefined) set.decisionNote = decisionNote;
        const rows = await db
          .insert(schema.spendReviews)
          .values({
            groupId,
            spendId,
            member,
            seenAt: seen ? now : null,
            decisionNote: decisionNote ?? null,
          })
          .onConflictDoUpdate({
            target: [schema.spendReviews.groupId, schema.spendReviews.spendId, schema.spendReviews.member],
            set: Object.keys(set).length > 0 ? set : { member },
          })
          .returning();
        return rows[0]!;
      },
      async listByGroup(groupId) {
        return db
          .select()
          .from(schema.spendReviews)
          .where(eq(schema.spendReviews.groupId, groupId));
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
      async getByHash(receiptHash) {
        const rows = await db
          .select()
          .from(schema.receipts)
          .where(and(eq(schema.receipts.receiptHash, receiptHash), eq(schema.receipts.status, "ready")))
          .limit(1);
        return rows[0] ?? null;
      },
      async markReady(id, receiptHash, sizeBytes) {
        await db
          .update(schema.receipts)
          .set({ status: "ready", receiptHash, sizeBytes })
          .where(eq(schema.receipts.id, id));
      },
      async remove(id) {
        await db.delete(schema.receipts).where(eq(schema.receipts.id, id));
      },
      async listByGroup(groupId) {
        return db
          .select()
          .from(schema.receipts)
          .where(and(eq(schema.receipts.groupId, groupId), eq(schema.receipts.status, "ready")))
          .orderBy(desc(schema.receipts.createdAt));
      },
      async listStalePending(before) {
        return db
          .select()
          .from(schema.receipts)
          .where(and(eq(schema.receipts.status, "pending"), lt(schema.receipts.createdAt, before)));
      },
    },

    invoices: {
      async insertMany(rows) {
        if (rows.length === 0) return 0;
        const inserted = await db
          .insert(schema.invoices)
          .values(rows)
          .onConflictDoNothing()
          .returning({ number: schema.invoices.number });
        return inserted.length;
      },
      async countByGroup(groupId) {
        const rows = await db
          .select({ value: sql<string>`count(*)::int` })
          .from(schema.invoices)
          .where(eq(schema.invoices.groupId, groupId));
        return Number(rows[0]?.value ?? 0);
      },
      async get(groupId, member) {
        const rows = await db
          .select()
          .from(schema.invoices)
          .where(and(eq(schema.invoices.groupId, groupId), eq(schema.invoices.member, member)))
          .limit(1);
        return rows[0] ?? null;
      },
      async getByNumber(number) {
        const rows = await db
          .select()
          .from(schema.invoices)
          .where(eq(schema.invoices.number, number))
          .limit(1);
        return rows[0] ?? null;
      },
      async recordDebtPaid(groupId, member, amount) {
        const paid = sql`${schema.invoices.debtPaid} + ${amount.toString()}::numeric`;
        const rows = await db
          .update(schema.invoices)
          .set({
            debtPaid: paid as unknown as string,
            status: sql`case when ${schema.invoices.status} = 'due' and ${paid} >= ${schema.invoices.remainingDebt} then 'paid' else ${schema.invoices.status} end` as unknown as InvoiceStatus,
          })
          .where(and(eq(schema.invoices.groupId, groupId), eq(schema.invoices.member, member)))
          .returning();
        return rows[0] ?? null;
      },
    },

    pushSubs: {
      async upsert({ address, expoPushToken, platform }) {
        await db
          .insert(schema.pushSubs)
          .values({ address, expoPushToken, platform })
          .onConflictDoUpdate({
            target: [schema.pushSubs.address, schema.pushSubs.expoPushToken],
            set: { platform },
          });
      },
      async deleteToken(expoPushToken, address) {
        await db
          .delete(schema.pushSubs)
          .where(
            address
              ? and(eq(schema.pushSubs.expoPushToken, expoPushToken), eq(schema.pushSubs.address, address))
              : eq(schema.pushSubs.expoPushToken, expoPushToken),
          );
      },
      async listByAddresses(addresses) {
        if (addresses.length === 0) return [];
        return db
          .select()
          .from(schema.pushSubs)
          .where(inArray(schema.pushSubs.address, addresses));
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
            and(
              eq(schema.groupKeyWraps.groupId, groupId),
              eq(schema.groupKeyWraps.memberAddress, memberAddress),
            ),
          )
          .limit(1);
        return rows[0] ?? null;
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

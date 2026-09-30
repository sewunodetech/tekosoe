import {
  bigint,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * The single source of truth for the metadata database (ADR 0004 replaces database/).
 * Metadata only. Money, balances, membership and spends live on-chain and are read
 * through Envio — never copied into these tables.
 * Every address is stored lowercase; group/spend ids are bigint (ids stay far below 2^53).
 */

/** Status columns are typed here so `select()` returns the literal unions. */
export type GasDripStatus = "pending" | "confirmed";
export type SettleRunStatus = "submitted" | "confirmed" | "failed" | "skipped";
export type ReceiptStatus = "pending" | "ready";
export type InvoiceStatus = "paid" | "refunded" | "due";
export type PushPlatform = "ios" | "android";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------- operational

export const gasDrips = pgTable(
  "gas_drips",
  {
    address: varchar("address", { length: 42 }).primaryKey(),
    status: varchar("status", { length: 16 }).$type<GasDripStatus>().notNull(),
    txHash: varchar("tx_hash", { length: 66 }),
    amountWei: numeric("amount_wei", { precision: 78, scale: 0 }),
    createdAt: createdAt(),
  },
  (table) => [index("gas_drips_created_at_idx").on(table.createdAt)],
);

export const settleRuns = pgTable(
  "settle_runs",
  {
    groupId: bigint("group_id", { mode: "number" }).primaryKey(),
    status: varchar("status", { length: 16 }).$type<SettleRunStatus>().notNull(),
    txHash: varchar("tx_hash", { length: 66 }),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lastError: text("last_error"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("settle_runs_updated_at_idx").on(table.updatedAt)],
);

export const authNonces = pgTable(
  "auth_nonces",
  {
    nonce: varchar("nonce", { length: 64 }).primaryKey(),
    address: varchar("address", { length: 42 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    index("auth_nonces_address_idx").on(table.address),
    index("auth_nonces_expires_at_idx").on(table.expiresAt),
  ],
);

export const processedEvents = pgTable(
  "processed_events",
  {
    txHash: varchar("tx_hash", { length: 66 }).notNull(),
    logIndex: integer("log_index").notNull(),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.txHash, table.logIndex] })],
);

export const kvState = pgTable("kv_state", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
});

// ---------------------------------------------------------------- P0 metadata

/** Home, Invite, Trip members. Public by design (the invite screen shows the inviter). */
export const profiles = pgTable("profiles", {
  address: varchar("address", { length: 42 }).primaryKey(),
  displayName: varchar("display_name", { length: 40 }).notNull(),
  city: varchar("city", { length: 60 }),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  avatarColor: varchar("avatar_color", { length: 32 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Home, Trip, Invite. Written once by the creator; inviteCodeHash must equal inviteHash on-chain. */
export const groupMeta = pgTable("group_meta", {
  groupId: bigint("group_id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 60 }).notNull(),
  inviteCodeHash: varchar("invite_code_hash", { length: 66 }).notNull(),
  createdBy: varchar("created_by", { length: 42 }).notNull(),
  createdAt: createdAt(),
});

/** Activity, Payment details, Approval. noteHash always equals the spend's noteHash on-chain. */
export const spendMeta = pgTable(
  "spend_meta",
  {
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    spendId: bigint("spend_id", { mode: "number" }).notNull(),
    noteHash: varchar("note_hash", { length: 66 }).notNull(),
    title: varchar("title", { length: 80 }).notNull(),
    category: varchar("category", { length: 32 }).notNull().default("other"),
    note: varchar("note", { length: 500 }).notNull().default(""),
    receiptHash: varchar("receipt_hash", { length: 66 }),
    createdBy: varchar("created_by", { length: 42 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.spendId] }),
    index("spend_meta_note_hash_idx").on(table.groupId, table.noteHash),
  ],
);

/**
 * Add receipt / receipt badge in Activity. Only ciphertext lives in object storage;
 * receiptHash = keccak256(ciphertext) = receiptHash passed to attachReceipt on-chain.
 * A row starts "pending" (presigned upload issued) and becomes "ready" after the
 * uploaded bytes are verified.
 */
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    spendId: bigint("spend_id", { mode: "number" }).notNull(),
    uploaderAddress: varchar("uploader_address", { length: 42 }).notNull(),
    storageKey: varchar("storage_key", { length: 255 }).notNull().unique(),
    receiptHash: varchar("receipt_hash", { length: 66 }),
    mime: varchar("mime", { length: 64 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: varchar("status", { length: 16 }).$type<ReceiptStatus>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("receipts_hash_idx").on(table.receiptHash),
    index("receipts_spend_idx").on(table.groupId, table.spendId),
  ],
);

/**
 * Trip invoice. `payload` is the exact canonical JSON that was hashed
 * (`invoiceHash = keccak256(payload)`, see buildInvoicePayload in @tekosoe/shared);
 * status may move from "due" to "paid" without changing the hash.
 */
export const invoices = pgTable(
  "invoices",
  {
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    member: varchar("member", { length: 42 }).notNull(),
    number: varchar("number", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 16 }).$type<InvoiceStatus>().notNull(),
    invoiceHash: varchar("invoice_hash", { length: 66 }).notNull(),
    payload: text("payload").notNull(),
    remainingDebt: numeric("remaining_debt", { precision: 78, scale: 0 }).notNull().default("0"),
    debtPaid: numeric("debt_paid", { precision: 78, scale: 0 }).notNull().default("0"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.member] })],
);

// ---------------------------------------------------------------- P1 metadata

/** Waiting (Seen) and Declined (reviewer's note). */
export const spendReviews = pgTable(
  "spend_reviews",
  {
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    spendId: bigint("spend_id", { mode: "number" }).notNull(),
    member: varchar("member", { length: 42 }).notNull(),
    seenAt: timestamp("seen_at", { withTimezone: true }),
    decisionNote: varchar("decision_note", { length: 280 }),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.spendId, table.member] })],
);

/** Expo push tokens (apps/mobile uses expo-notifications). */
export const pushSubs = pgTable(
  "push_subs",
  {
    address: varchar("address", { length: 42 }).notNull(),
    expoPushToken: varchar("expo_push_token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 16 }).$type<PushPlatform>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.address, table.expoPushToken] }),
    index("push_subs_token_idx").on(table.expoPushToken),
  ],
);

// ---------------------------------------------------------------- P2 group key exchange

/** Each member's X25519 public key, derived from the passkey PRF on the device. */
export const memberEncKeys = pgTable("member_enc_keys", {
  address: varchar("address", { length: 42 }).primaryKey(),
  encPublicKey: varchar("enc_public_key", { length: 200 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** The group AES key wrapped for one member (replaces `group_keys` from the draft spec). */
export const groupKeyWraps = pgTable(
  "group_key_wraps",
  {
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    memberAddress: varchar("member_address", { length: 42 }).notNull(),
    wrappedKey: text("wrapped_key").notNull(),
    wrappedBy: varchar("wrapped_by", { length: 42 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.memberAddress] })],
);

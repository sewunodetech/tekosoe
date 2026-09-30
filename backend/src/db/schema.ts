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
 * Metadata only. Money, balances, membership and spends live on-chain and are read
 * through Envio — never copied into these tables.
 * Every address is stored lowercase; group ids are bigint.
 */

/** Status columns are typed here so `select()` returns the literal unions. */
export type GasDripStatus = "pending" | "confirmed";
export type SettleRunStatus = "submitted" | "confirmed" | "failed" | "skipped";
export type ReceiptStatus = "pending" | "ready";

export const gasDrips = pgTable(
  "gas_drips",
  {
    address: varchar("address", { length: 42 }).primaryKey(),
    status: varchar("status", { length: 16 }).$type<GasDripStatus>().notNull(),
    txHash: varchar("tx_hash", { length: 66 }),
    amountWei: numeric("amount_wei", { precision: 78, scale: 0 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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

export const profiles = pgTable("profiles", {
  address: varchar("address", { length: 42 }).primaryKey(),
  displayName: varchar("display_name", { length: 40 }).notNull(),
  avatar: varchar("avatar", { length: 32 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    uploaderAddress: varchar("uploader_address", { length: 42 }).notNull(),
    storageKey: varchar("storage_key", { length: 255 }).notNull().unique(),
    noteHash: varchar("note_hash", { length: 66 }),
    sizeBytes: integer("size_bytes").notNull(),
    status: varchar("status", { length: 16 }).$type<ReceiptStatus>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("receipts_note_hash_idx").on(table.noteHash),
    index("receipts_group_idx").on(table.groupId),
  ],
);

export const memberEncKeys = pgTable("member_enc_keys", {
  address: varchar("address", { length: 42 }).primaryKey(),
  encPublicKey: varchar("enc_public_key", { length: 200 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const groupKeyWraps = pgTable(
  "group_key_wraps",
  {
    groupId: bigint("group_id", { mode: "number" }).notNull(),
    memberAddress: varchar("member_address", { length: 42 }).notNull(),
    wrappedKey: text("wrapped_key").notNull(),
    wrappedBy: varchar("wrapped_by", { length: 42 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.memberAddress] })],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    address: varchar("address", { length: 42 }).notNull(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("push_subscriptions_address_idx").on(table.address)],
);

export const processedEvents = pgTable(
  "processed_events",
  {
    txHash: varchar("tx_hash", { length: 66 }).notNull(),
    logIndex: integer("log_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.txHash, table.logIndex] })],
);

export const kvState = pgTable("kv_state", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
});

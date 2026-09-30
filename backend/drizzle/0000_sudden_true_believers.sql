CREATE TABLE "auth_nonces" (
	"nonce" varchar(64) PRIMARY KEY NOT NULL,
	"address" varchar(42) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "gas_drips" (
	"address" varchar(42) PRIMARY KEY NOT NULL,
	"status" varchar(16) NOT NULL,
	"tx_hash" varchar(66),
	"amount_wei" numeric(78, 0),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_key_wraps" (
	"group_id" bigint NOT NULL,
	"member_address" varchar(42) NOT NULL,
	"wrapped_key" text NOT NULL,
	"wrapped_by" varchar(42) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_key_wraps_group_id_member_address_pk" PRIMARY KEY("group_id","member_address")
);
--> statement-breakpoint
CREATE TABLE "kv_state" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_enc_keys" (
	"address" varchar(42) PRIMARY KEY NOT NULL,
	"enc_public_key" varchar(200) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"tx_hash" varchar(66) NOT NULL,
	"log_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_events_tx_hash_log_index_pk" PRIMARY KEY("tx_hash","log_index")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"address" varchar(42) PRIMARY KEY NOT NULL,
	"display_name" varchar(40) NOT NULL,
	"avatar" varchar(32),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(42) NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"uploader_address" varchar(42) NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"note_hash" varchar(66),
	"size_bytes" integer NOT NULL,
	"status" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "settle_runs" (
	"group_id" bigint PRIMARY KEY NOT NULL,
	"status" varchar(16) NOT NULL,
	"tx_hash" varchar(66),
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_nonces_address_idx" ON "auth_nonces" USING btree ("address");--> statement-breakpoint
CREATE INDEX "auth_nonces_expires_at_idx" ON "auth_nonces" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "gas_drips_created_at_idx" ON "gas_drips" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "push_subscriptions_address_idx" ON "push_subscriptions" USING btree ("address");--> statement-breakpoint
CREATE INDEX "receipts_note_hash_idx" ON "receipts" USING btree ("note_hash");--> statement-breakpoint
CREATE INDEX "receipts_group_idx" ON "receipts" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "settle_runs_updated_at_idx" ON "settle_runs" USING btree ("updated_at");
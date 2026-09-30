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
CREATE TABLE "group_meta" (
	"group_id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(60) NOT NULL,
	"invite_code_hash" varchar(66) NOT NULL,
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"group_id" bigint NOT NULL,
	"member" varchar(42) NOT NULL,
	"number" varchar(64) NOT NULL,
	"status" varchar(16) NOT NULL,
	"invoice_hash" varchar(66) NOT NULL,
	"payload" text NOT NULL,
	"remaining_debt" numeric(78, 0) DEFAULT '0' NOT NULL,
	"debt_paid" numeric(78, 0) DEFAULT '0' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_group_id_member_pk" PRIMARY KEY("group_id","member"),
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
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
	"city" varchar(60),
	"country_code" varchar(2) NOT NULL,
	"avatar_color" varchar(32),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subs" (
	"address" varchar(42) NOT NULL,
	"expo_push_token" varchar(255) NOT NULL,
	"platform" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subs_address_expo_push_token_pk" PRIMARY KEY("address","expo_push_token")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" bigint NOT NULL,
	"spend_id" bigint NOT NULL,
	"uploader_address" varchar(42) NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"receipt_hash" varchar(66),
	"mime" varchar(64) NOT NULL,
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
CREATE TABLE "spend_meta" (
	"group_id" bigint NOT NULL,
	"spend_id" bigint NOT NULL,
	"note_hash" varchar(66) NOT NULL,
	"title" varchar(80) NOT NULL,
	"category" varchar(32) DEFAULT 'other' NOT NULL,
	"note" varchar(500) DEFAULT '' NOT NULL,
	"receipt_hash" varchar(66),
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spend_meta_group_id_spend_id_pk" PRIMARY KEY("group_id","spend_id")
);
--> statement-breakpoint
CREATE TABLE "spend_reviews" (
	"group_id" bigint NOT NULL,
	"spend_id" bigint NOT NULL,
	"member" varchar(42) NOT NULL,
	"seen_at" timestamp with time zone,
	"decision_note" varchar(280),
	CONSTRAINT "spend_reviews_group_id_spend_id_member_pk" PRIMARY KEY("group_id","spend_id","member")
);
--> statement-breakpoint
CREATE INDEX "auth_nonces_address_idx" ON "auth_nonces" USING btree ("address");--> statement-breakpoint
CREATE INDEX "auth_nonces_expires_at_idx" ON "auth_nonces" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "gas_drips_created_at_idx" ON "gas_drips" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "push_subs_token_idx" ON "push_subs" USING btree ("expo_push_token");--> statement-breakpoint
CREATE INDEX "receipts_hash_idx" ON "receipts" USING btree ("receipt_hash");--> statement-breakpoint
CREATE INDEX "receipts_spend_idx" ON "receipts" USING btree ("group_id","spend_id");--> statement-breakpoint
CREATE INDEX "settle_runs_updated_at_idx" ON "settle_runs" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "spend_meta_note_hash_idx" ON "spend_meta" USING btree ("group_id","note_hash");
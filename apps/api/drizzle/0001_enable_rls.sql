-- RLS on, no policies: a safety net for any role other than the table owner (the api role),
-- e.g. Supabase anon/authenticated. apps/api is the only client of this database.
ALTER TABLE "auth_nonces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gas_drips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "group_key_wraps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "group_meta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kv_state" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "member_enc_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "processed_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "push_subs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settle_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "spend_meta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "spend_reviews" ENABLE ROW LEVEL SECURITY;

# 0002 — Metadata database provider

- Status: proposed (not final)
- Date: 2026-09-28

## Context

The technical spec picked Supabase (Postgres + Storage) for off-chain metadata. The team considered Neon instead. Neon only provides Postgres: no object storage and no built-in `anon`/`service_role` roles.

## Interim decision

- The `supabase/` folder becomes `database/`; SQL is written as standard Postgres.
- `apps/api` connects through a single `DATABASE_URL` (instead of a Supabase URL + service role key).
- Encrypted receipts live in separate object storage, configured through environment variables.

## Still to decide

- [ ] Neon or Supabase for Postgres.
- [ ] Object storage for receipt ciphertext if we use Neon (for example Cloudflare R2 or another S3-compatible service).
- [ ] Driver/ORM in `apps/api` (for example `@neondatabase/serverless`, `postgres`, Drizzle).

## Consequences

- The team's planning documents still mention Supabase; update them once this is final.
- The core rules don't change: the database holds metadata only, never balances, and only `apps/api` can reach it.
- Partly answered by [ADR 0004](0004-api-express.md): Drizzle + `pg` as the driver, S3-compatible storage for receipts, and Neon as the host in the current deployment.

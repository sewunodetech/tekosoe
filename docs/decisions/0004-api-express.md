# 0004 — apps/api uses Express, Drizzle and Neon

- Status: proposed (awaiting team confirmation)
- Date: 2026-09-30

## Context

ADR 0001 and the technical spec chose Hono for `apps/api`, and `apps/api` only held an empty Hono skeleton. The backend that was actually built (PR #5, originally in a `backend/` folder) uses Express 5 and already has auth, the gas drip, the settle-up scheduler, profiles, receipts, trip keys, push, tests and OpenAPI.

## Decision

- Move the Express backend into `apps/api`, replacing the Hono skeleton; the package is `@tekosue/api`, with a single `package-lock.json` at the root.
- api stack: Express 5, Drizzle ORM + `pg`, `drizzle-kit` migrations in `apps/api/drizzle/`, S3-compatible storage for receipt ciphertext, SIWE sign-in → HS256 JWT.
- Docker builds from the repo root: `docker build -f apps/api/Dockerfile .`.

## Consequences

- ADR 0001 (the `apps/api` part) and the technical spec still mention Hono; the planning documents are updated once this is approved.
- This also answers part of ADR 0002 (driver: Drizzle + `pg`; storage: S3-compatible), though Neon vs Supabase is still open.
- The database schema lives only in `apps/api/src/db/schema.ts` (migrations in `apps/api/drizzle/`); the `database/` folder is gone. Trip keys use `member_enc_keys` + `group_key_wraps` instead of the spec draft's `group_keys`.
- Push goes through the Expo Push API (not Web Push), matching `push_subs` in the spec.

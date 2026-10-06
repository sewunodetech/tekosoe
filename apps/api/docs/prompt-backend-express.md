# Prompt: generate the Tekosue backend (Express.js)

> **Historical record.** This is the prompt the team used with an AI coding assistant to generate the first draft of `apps/api` (30 Sep 2026), kept for transparency about AI use. The code has moved on since: web-push became Expo Push, pnpm became npm workspaces, receipts use `receiptHash`, `getGroup` returns a struct, and notifications now come from Envio by default (ADR 0014). For the current behaviour see [`API.md`](./API.md) and [`coverage.md`](./coverage.md).

**How to use:** open Claude Code (or another AI coding tool) at the monorepo root, attach `Tekosoe_-_Dokumen_Produk.md`, then paste everything below the line as the prompt.

---

## 1. Role and goal

You are a senior TypeScript backend engineer. Build the **mini backend for Tekosue** in `apps/api` with **Express.js**, following the attached product documents (BRD, PRD, Technical Specification, User Stories, User Flow). Those documents are the source of truth. If this prompt contradicts them, follow the documents and record the contradiction in `docs/coverage.md`.

Tekosue is a mobile app for a shared pot across countries. Users deposit AUSD into one group pot in a contract on Monad testnet, spend from it, and on the group's end date the contract settles who pays whom. Users sign in with a passkey (Mera) and never hold a gas token.

Your goal: a backend that **covers every flow that actually needs a backend**, no more and no less, with tests, documentation, and ready to deploy to Railway.

## 2. Architecture principles (never break them)

1. The backend **never holds users' keys or funds**. The backend's own keys are only used to (a) send a little MON to new accounts and (b) call `settle`.
2. **The contract + Envio are the source of truth** for all money data (groups, members, balances, payments). The database only stores non-chain data. Never copy balances, members or payments into the database.
3. The frontend reads Envio directly. The backend **is not a GraphQL proxy**.
4. `inviteSecret` is never sent to the backend and never logged. Invite links are created and opened in the frontend.
5. Every job must be **idempotent** and safe to re-run.
6. Text that can reach a user's screen (push notifications, user-facing error messages) **must not** contain "wallet", "gas", "seed phrase" or "blockchain" (NFR-07). Amounts are written in dollars, e.g. `$12.50`.
7. The backend doesn't implement a relayer or meta-transactions. The chosen gas path is a **MON drip**. Alchemy Gas Manager runs in the frontend and doesn't need the backend.

## 3. Tech stack (fixed)

- Node.js 22, strict TypeScript, ESM, **Express 5**
- PostgreSQL on Neon, `pg` + **Drizzle ORM** + `drizzle-kit` for migrations
- `viem` for the chain, `zod` for validation, `jose` for JWT, `pino` + `pino-http` for logs
- `helmet`, `cors`, `express-rate-limit`
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (S3-compatible, used for Neon Object Storage)
- `web-push` for push notifications
- `vitest` + `supertest` for tests
- Scheduler: **`setInterval` inside the Express process** (not Railway cron, not a cron library)
- Package manager pnpm; the code lives in `apps/api` in the monorepo. If `packages/shared` (ABI, addresses, types) already exists, use it. If not, create `src/chain/abi.ts` from the list in section 6 and mark it `// TODO: replace with @tekosue/shared`.

Expected layout:

```
apps/api/
  src/
    index.ts               # bootstrap, start scheduler, graceful shutdown
    app.ts                 # createApp(deps) so it's easy to test
    config/env.ts          # env validated with zod, fail fast
    db/                    # client.ts, schema.ts, migrate.ts
    chain/                 # clients.ts, abi.ts, wallets.ts (mutex per wallet), groupVault.ts
    integrations/          # envio.ts, storage.ts (S3), webpush.ts
    middleware/            # auth, validate, error, rateLimit, adminKey
    modules/
      health/  onboarding/  settle/  auth/  profiles/  receipts/  keys/  push/  webhooks/
    lib/                   # address.ts, errors.ts, logger.ts, money.ts, mutex.ts
  test/
  drizzle/                 # migrations
  Dockerfile  .env.example  drizzle.config.ts  README.md
docs/coverage.md
```

Code rules: thin routes, logic in services, DB access in repositories, dependencies (db, chain client, envio client, storage) injected through `createApp(deps)` so they can be mocked. Code comments in English.

## 4. Mapping PRD flows to the backend

| PRD flow / need | Backend role | Module |
| --- | --- | --- |
| FR-03, US-01: the first transaction succeeds even when the account has no MON | Send a little MON to new accounts | `onboarding` |
| FR-11, US-09: automatic settle-up on the end date | The scheduler calls `settle` | `settle` |
| FR-12, US-10: paying a bill (`payDebt`) | None. The frontend calls the contract directly | - |
| FR-14, FR-15, US-11: feed and balances | None. The frontend reads Envio directly | - |
| FR-01, FR-02, FR-04 to FR-10, FR-16 | None. Frontend + Mera + contract | - |
| Screens 5, 7, 13: readable member names instead of `0x...` (**an assumption, not in the documents**) | Store and serve profiles | `profiles` (+ `auth`) |
| FR-17, US-13: encrypted receipts (P2) | Store ciphertext, manage encrypted group keys | `receipts`, `keys` |
| FR-18, US-14: notifications (P3) | Receive webhooks, send push | `push`, `webhooks` |
| Demo operations | Health, status, manual settle trigger | `health`, `settle` (admin) |

## 5. Module specification

Every endpoint is under the `/api` prefix, except `/health`. Uniform error format: `{ "error": { "code": "SNAKE_UPPER", "message": "...", "details": {} } }`. Addresses are always normalised (`getAddress` for output, lowercase in the DB).

### 5.0 Foundation

- `app.set('trust proxy', 1)` (Railway is behind a proxy; rate limits must read the real IP).
- `helmet`, a CORS allowlist from `CORS_ORIGINS`, `express.json({ limit: '100kb' })`, a request id, `pino-http` with redaction for the `authorization` and `x-admin-key` headers.
- A zod-based `validate(schema)` middleware, a global error handler, a 404 handler.
- On start: validate env, check the RPC `chainId` equals `CHAIN_ID` (10143), check there is contract code at `GROUP_VAULT_ADDRESS`, check `DRIP_PRIVATE_KEY` differs from `SETTLER_PRIVATE_KEY`, check the DB connection. On failure, stop the process with a clear message.
- Graceful shutdown on `SIGTERM`: stop the scheduler and other intervals, close the server and the DB pool.

### 5.1 Health and status (`health`)

- `GET /health`: liveness with no dependencies, answers `{ "status": "ok" }`. Used by Railway's healthcheck.
- `GET /api/status` (header `x-admin-key`): DB ping, latest RPC block, Envio ping, scheduler state (`lastTickAt`, `lastTickDurationMs`, `lastError`, `dueCandidates`), the MON balances of the drip and settler wallets with a `low` flag (below `LOW_BALANCE_THRESHOLD_MON`). Never return secrets.

### 5.2 Onboarding drip (`onboarding`, P0)

`POST /api/onboard/drip` body `{ "address": "0x..." }`. No auth (a new account has no session yet), protected by these guardrails.

1. Validate the address.
2. If the address is already in `gas_drips` with status `confirmed`, answer 200 `{ "status": "already_funded" }` (idempotent, not an error).
3. Rate limit per IP (`DRIP_RATE_LIMIT_PER_HOUR`, default 5) and a global daily cap (`DRIP_DAILY_CAP`, default 200). Over the limit, answer 429 with code `DRIP_LIMIT_REACHED`.
4. If the address's MON balance is already `>= DRIP_MIN_BALANCE_MON`, answer 200 `{ "status": "sufficient_balance" }` without sending.
5. Claim first with an `INSERT` into `gas_drips` (unique on `address`, status `pending`) to prevent races. Send `DRIP_AMOUNT_MON` from the drip wallet through the per-wallet mutex and wait for the receipt (20-second timeout). On success, store `tx_hash` and status `confirmed`. On failure, delete the claim so it can be retried.
6. Answer `{ "status": "funded", "txHash": "0x..." }` **only after the transaction is confirmed**, so the user's first transaction (join + deposit) doesn't fail because the balance hasn't arrived.

### 5.3 Settle scheduler (`settle`, P0)

This is the core feature (FR-11). The contract can't run by itself, so the backend calls `settle(groupId)` after `endsAt + disputeWindow`.

- `startSettleScheduler(deps)` is called from `index.ts`. Use `setInterval` with `SETTLE_INTERVAL_MS` (default 30000), first tick 5 seconds after boot. An `isRunning` guard makes sure ticks never overlap. Deployment assumes **one replica**; with two, results stay safe because everything is idempotent (it only wastes gas).
- Export `runSettleSweep(deps)` so it can be tested. Its steps:
  1. `now` = the **latest block timestamp from the chain** (the contract uses `block.timestamp`, not the server clock). If the RPC fails, skip the tick and log the error.
  2. Get candidates from Envio: groups with `status = Active` and `endsAt <= now`, paginated. If Envio fails, log the error, don't crash, wait for the next tick.
  3. Skip candidates whose `next_attempt_at` in `settle_runs` is still in the future.
  4. For each candidate (sequentially, one at a time because of the nonce): read `getGroup` from the contract. If the status isn't Active, mark it `skipped`. If `now < endsAt + disputeWindow`, skip it (not yet). Note: the `Group` entity in the Envio draft **has no `disputeWindow`**, so it must be read from the contract.
  5. `simulateContract` for `settle`. If it reverts because it's already settled, mark it `skipped` (members may call `settle` as a fallback). If it reverts for another reason, record `failed` with backoff.
  6. Send the transaction from the settler wallet with the mutex. Monad charges gas based on the gas limit, so use the estimate with a small buffer (about 20%), not more. Wait for the receipt, then mark `confirmed` and store `tx_hash`. If the receipt reverted, mark `failed` with backoff.
  7. Store the result in `settle_runs` (one row per group, upsert) and log `{ groupId, txHash, durationMs, status }` in a structured log.
- Backoff: `30s * 2^attempts`, at most 10 minutes. After `SETTLE_ALERT_ATTEMPTS` (default 8), log at `error` level with `alert: true`, but keep trying.
- Admin, with the `x-admin-key` header:
  - `POST /api/admin/settle/:groupId`: run steps 4 to 7 for one group right now (ignoring backoff). This is the safety net for demos. Answer with the result.
  - `GET /api/admin/settle`: the 50 latest `settle_runs` rows.

### 5.4 Auth (`auth`)

Passwordless sign-in. A Mera account is an EOA, so a normal signature check is enough (no ERC-1271). Used for protected endpoints (profiles, receipts, keys, push).

- `POST /api/auth/challenge` body `{ address }` creates a random single-use nonce (valid 5 minutes, stored in `auth_nonces`) and returns `{ message, nonce, expiresAt }`. Use the SIWE format (EIP-4361) through `viem/siwe` if the viem version in use has it. If not, build a simple message containing the domain (`AUTH_DOMAIN`), address, `chainId`, nonce and time.
- `POST /api/auth/verify` body `{ address, signature }`. Verify the signature, check the nonce is unused and not expired, mark it used, then return `{ token, expiresAt }`. The token is an HS256 JWT (`AUTH_JWT_SECRET`), `sub` = address, TTL `AUTH_TOKEN_TTL_SECONDS` (default 3600).
- The `requireAuth` middleware fills `req.auth.address`. The `requireGroupMember(groupIdFrom)` middleware reads `membersOf` **directly from the contract** (15-second memory cache; if the address isn't in the cache, check on-chain again so freshly joined members aren't refused because Envio hasn't caught up).
- Clean up expired `auth_nonces` every hour (`setInterval`).

### 5.5 Profiles (`profiles`, P1)

- `PUT /api/profiles/me` (auth): `{ displayName (1 to 40 characters, trimmed, no control characters), avatar? (string, max 32 characters, an emoji or preset key) }`. Image URLs are not accepted (avoids hosting and abuse).
- `GET /api/profiles/me` (auth).
- `GET /api/profiles?addresses=0x..,0x..` (public, at most 20 addresses, rate limited): used by the invite link screen, which shows the inviter's and members' names before the user joins. Return only addresses with a profile. Note in the README that display names are public.

### 5.6 Receipts (`receipts`, P2, behind `FEATURE_RECEIPTS`)

The backend only stores **ciphertext**. Encryption and decryption happen on the device. The flow:

1. `POST /api/receipts/upload-url` (auth + group member): `{ groupId, sizeBytes }`. Refuse when `sizeBytes > RECEIPT_MAX_BYTES` (default 5 MB). Create a `receipts` row with status `pending` and `storage_key = receipts/{groupId}/{uuid}`. Return a presigned PUT URL (valid 5 minutes, set `Content-Type: application/octet-stream` and limit the size where possible) with `{ receiptId, uploadUrl, headers, expiresInSeconds }`.
2. `POST /api/receipts/:id/confirm` (auth, uploader only): `{ noteHash }`. `HeadObject` must exist with a matching size, and the object must not exceed the limit (delete it if it does). If `RECEIPT_VERIFY_HASH=true` (default), download the object and make sure `keccak256(bytes) === noteHash` (ASSUMPTION: `noteHash` = keccak256 of the ciphertext; align with the frontend). Then the status becomes `ready`.
3. `GET /api/receipts/by-hash/:noteHash` (auth): find a `ready` receipt, check the caller is a member of the receipt's group, return `{ receiptId, groupId, sizeBytes, downloadUrl }` (5-minute presigned GET). The frontend uses the `noteHash` from the payment data in Envio.
4. `GET /api/groups/:groupId/receipts` (auth + member): `ready` receipt metadata without URLs.
5. Clean up `pending` receipts older than 1 hour (delete the object and the row) with an hourly `setInterval`.

Storage uses an S3 client with `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, so it works with Neon Object Storage, Cloudflare R2 or S3. In the README, explain that the bucket needs CORS so browsers can PUT to the presigned URL.

### 5.7 Group encryption keys (`keys`, P2, behind `FEATURE_RECEIPTS`)

The design proposed in the documents ("Receipt encryption" section). The backend only stores already-encrypted blobs and never sees the group key.

- `PUT /api/keys/me` (auth): `{ encPublicKey }` (string, max 200 characters), upsert into `member_enc_keys`.
- `GET /api/groups/:groupId/keys` (auth + member): `[{ address, encPublicKey | null }]` for every group member (from `membersOf`).
- `PUT /api/groups/:groupId/key-wraps` (auth + member): `{ wraps: [{ member, wrappedKey }] }` (max 10). Each `member` must be a group member on the contract. **Insert-only** (`ON CONFLICT DO NOTHING`, never overwrite), store `wrapped_by`. Answer with the number of rows created.
- `GET /api/groups/:groupId/key-wraps/me` (auth + member): `{ wrappedKey, wrappedBy }` or 404 `KEY_WRAP_NOT_FOUND`.

### 5.8 Push and webhooks (`push`, `webhooks`, P3, behind `FEATURE_PUSH`)

- `GET /api/push/vapid-public-key` (public).
- `POST /api/push/subscribe` (auth): `{ endpoint, keys: { p256dh, auth } }`, upsert by `endpoint`.
- `DELETE /api/push/subscribe` (auth): `{ endpoint }`.
- `POST /api/webhooks/alchemy`: mount `express.raw` for this route only (before `express.json`). Verify an HMAC-SHA256 of the raw body with `ALCHEMY_WEBHOOK_SIGNING_KEY` against the `x-alchemy-signature` header using `timingSafeEqual`. Answer 200 as fast as possible and process afterwards. Extract logs with an isolated `extractLogs(payload)` function (ASSUMPTION: a custom/GraphQL webhook with `event.data.block.logs[]` containing `topics`, `data`, `index`, `transaction.hash`; verify with a real payload and keep a fixture for tests). Keep only logs from `GROUP_VAULT_ADDRESS`, decode with `decodeEventLog`, and dedupe through `processed_events (tx_hash, log_index)` because Alchemy may redeliver.
- **Optional, only once every other phase is done:** `NOTIFY_SOURCE=envio` as a replacement for the webhook — a poller that reads the `Activity` table in Envio since the last cursor (stored in `kv_state`). A fallback in case Alchemy webhooks for Monad testnet aren't available.

Notification rules (Indonesian copy, AUSD amounts with 6 decimals written as `$12.50`, names from `profiles` with the fallback "Seorang anggota" ("a member"); group name from `getGroup`):

| Event | Recipients | Content (English meaning) |
| --- | --- | --- |
| `SpendRequested` | Every member except the spender | "Your approval is needed: {name} wants to use $X from the {group} pot." |
| `SpendExecuted` | Participants except the spender | "New payment of $X in {group}. Your share is $Y." |
| `SpendRejected` | The spender (from `getSpend`) | "Your payment in {group} was declined." |
| `ShareDisputed` | The spender (from `getSpend`) | "{name} disputed their share of $Y in {group}." |
| `Settled` | Every member | "Settle-up for {group} is done. See the result." |
| `Pulled` | The member concerned | "Your shortfall of $X in {group} was settled." If `remainingDebt > 0`, add "There is still a bill of $Z." |
| `Refunded` | The member concerned | "You received $X from the {group} pot." |

Other events (`GroupCreated`, `MemberJoined`, `Deposited`, `DebtPaid`) don't trigger push. Send through `web-push` (VAPID, 1-hour TTL, limited concurrency). Delete subscriptions answered with 404 or 410. Small payload: `{ title, body, url: "/groups/{id}", tag }`.

## 6. Contract used by the backend

The source of truth for the ABI is the Foundry build / `packages/shared`. This list is for the initial skeleton. The return shapes of view functions are **assumptions** and must be aligned with the real contract.

```ts
export const groupVaultAbi = parseAbi([
  // views (return shapes are ASSUMPTIONS)
  'function getGroup(uint256 groupId) view returns (string name, address creator, bytes32 inviteHash, uint64 endsAt, uint64 disputeWindow, uint256 approvalThreshold, uint256 pool, uint8 status)',
  'function membersOf(uint256 groupId) view returns (address[])',
  'function getSpend(uint256 groupId, uint256 spendId) view returns (address spender, address to, uint256 amount, uint64 executedAt, uint8 status, bytes32 noteHash)',
  // write
  'function settle(uint256 groupId)',
  // events
  'event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold)',
  'event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap)',
  'event Deposited(uint256 indexed groupId, address indexed member, uint256 amount)',
  'event SpendRequested(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount)',
  'event SpendExecuted(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash)',
  'event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by)',
  'event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share)',
  'event Settled(uint256 indexed groupId, uint256 poolBefore)',
  'event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt)',
  'event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit)',
  'event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount)',
]);
```

Enums: `GroupStatus { Active = 0, Settled = 1 }`, `SpendStatus { Pending = 0, Executed = 1, Rejected = 2 }`. AUSD uses 6 decimals (write a `formatAusd` helper). Network: Monad testnet, chain ID 10143.

The Envio query (HyperIndex, Hasura style) for the scheduler; isolate it in `integrations/envio.ts` and mark field names and types with `// ASSUMPTION: verify against actual schema.graphql`:

```graphql
query DueGroups($now: numeric!, $limit: Int!, $offset: Int!) {
  Group(where: { status: { _eq: "Active" }, endsAt: { _lte: $now } },
        order_by: { endsAt: asc }, limit: $limit, offset: $offset) {
    id
    endsAt
    status
  }
}
```

## 7. Database (Drizzle + Neon)

Every address is stored lowercase. `group_id` is a `bigint`. The app uses the **pooled** connection string (`DATABASE_URL`); migrations use the **direct** connection (`DATABASE_URL_UNPOOLED`).

| Table | Main columns |
| --- | --- |
| `gas_drips` | `address` (PK), `status` (pending, confirmed), `tx_hash`, `amount_wei`, `created_at` |
| `settle_runs` | `group_id` (PK), `status` (submitted, confirmed, failed, skipped), `tx_hash`, `attempts`, `next_attempt_at`, `last_error`, `updated_at` |
| `auth_nonces` | `nonce` (PK), `address`, `expires_at`, `used_at` |
| `profiles` | `address` (PK), `display_name`, `avatar`, `updated_at` |
| `receipts` | `id` (uuid, PK), `group_id`, `uploader_address`, `storage_key` (unique), `note_hash`, `size_bytes`, `status` (pending, ready), `created_at` |
| `member_enc_keys` | `address` (PK), `enc_public_key`, `updated_at` |
| `group_key_wraps` | `group_id`, `member_address`, `wrapped_key`, `wrapped_by`, `created_at`, PK (`group_id`, `member_address`) |
| `push_subscriptions` | `id`, `address`, `endpoint` (unique), `p256dh`, `auth`, `created_at` |
| `processed_events` | `tx_hash`, `log_index`, `created_at`, PK (`tx_hash`, `log_index`) |
| `kv_state` | `key` (PK), `value` (for the poller cursor and small stats) |

Create the initial migration, the `pnpm db:generate` and `pnpm db:migrate` scripts, and run migrations as a pre-deploy command (not automatically on every start).

## 8. Environment variables (`.env.example`, no secret values)

```
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://app.example.com
ADMIN_API_KEY=

# chain
CHAIN_ID=10143
MONAD_TESTNET_RPC_URL=
GROUP_VAULT_ADDRESS=
AUSD_ADDRESS=
ENVIO_GRAPHQL_URL=

# wallets (must differ)
DRIP_PRIVATE_KEY=
SETTLER_PRIVATE_KEY=
LOW_BALANCE_THRESHOLD_MON=0.5

# drip
DRIP_AMOUNT_MON=0.05
DRIP_MIN_BALANCE_MON=0.01
DRIP_RATE_LIMIT_PER_HOUR=5
DRIP_DAILY_CAP=200

# settle scheduler
SETTLE_INTERVAL_MS=30000
SETTLE_ALERT_ATTEMPTS=8

# database
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# auth
AUTH_DOMAIN=app.example.com
AUTH_JWT_SECRET=
AUTH_TOKEN_TTL_SECONDS=3600

# P2 (on when FEATURE_RECEIPTS=true)
FEATURE_RECEIPTS=false
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
RECEIPT_MAX_BYTES=5242880
RECEIPT_VERIFY_HASH=true

# P3 (on when FEATURE_PUSH=true)
FEATURE_PUSH=false
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
ALCHEMY_WEBHOOK_SIGNING_KEY=
NOTIFY_SOURCE=alchemy
```

Variables of features that are switched off (`FEATURE_*=false`) must not be required by env validation.

## 9. Security and resilience

- Rate limits: drip (per IP), `auth/challenge` and `auth/verify` (per IP), public `profiles` (per IP), upload URL (per address).
- Every input is validated with zod; refuse oversized bodies; never return stack traces to clients.
- Private keys are only read in `config/env.ts` and used in `chain/wallets.ts`. Never logged, never in a response.
- One mutex per wallet for every transaction send (prevents nonce collisions). The drip and settler wallets are separate.
- Admin endpoints only with `x-admin-key` (compared with `timingSafeEqual`).
- In-process jobs (settle, cleanup) must not crash the process: wrap them in try/catch, log the error, carry on with the next tick.

## 10. Testing (vitest + supertest, every external dependency mocked)

At least these tests:

- Auth: single-use nonce, expired nonce refused, wrong signature refused, the token works on protected endpoints.
- Drip: the same address twice doesn't send twice, per-IP and daily limits, enough balance doesn't send, a failed send releases the claim, the answer only comes after the receipt.
- Settle sweep: picks the right candidates, skips groups before `endsAt + disputeWindow`, `skipped` when already settled, backoff grows on failure, Envio being down doesn't crash anything, ticks don't overlap, the admin trigger.
- Receipts: non-members refused, oversized refused, mismatching `noteHash` refused, `by-hash` only for members of the owning group.
- Keys: a wrap can't overwrite, a non-member `member` is refused.
- Webhook: a wrong signature is refused, a duplicate event isn't sent twice, event → recipient mapping matches the notification table, 410 subscriptions are deleted.
- `formatAusd` and address normalisation.

## 11. Deliverables and order of work

Work **in phases**. Run `pnpm typecheck && pnpm test` until green before moving on, and at the end of each phase write a short summary of what's done and what was assumed.

1. **Phase 1 (P0):** foundation, health/status, drip, settle scheduler + admin endpoints, migrations for those tables, Dockerfile.
2. **Phase 2 (P1):** auth, profiles.
3. **Phase 3 (P2):** receipts, keys.
4. **Phase 4 (P3):** push, Alchemy webhook (the Envio poller is optional).

Final result:

- Complete code in `apps/api` with passing tests.
- A multi-stage `Dockerfile` (Node 22 slim), non-root user, healthcheck on `/health`.
- `README.md` in `apps/api`: how to run locally, a table of every endpoint with `curl` examples, env explanation, and Railway deploy steps (one replica, healthcheck `/health`, pre-deploy `pnpm db:migrate`, env variables, bucket CORS note).
- `docs/coverage.md`: an FR/US → endpoint matrix (or why it isn't in the backend), a list of every `ASSUMPTION`, and recommendations for the other teams (e.g. add `disputeWindow` to the `Group` entity in Envio, confirm the `noteHash` definition, confirm the shape `getGroup` returns).

## 12. When in doubt

- Don't invent contract or Envio schema details. If the documents don't say, use the assumptions in this prompt, mark them `// ASSUMPTION:` in the code, and list them in `docs/coverage.md`.
- Don't add features beyond this list. If you think a backend flow is missing, record it in `docs/coverage.md` as a proposal and don't build it right away.
- Prefer simple, readable code over heavy abstraction: this is a hackathon project with a deadline.

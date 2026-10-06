# apps/api — coverage, gaps and assumptions

A review made when the backend moved from `backend/` to `apps/api` (30 Sep 2026), with the status of each fix, updated on 6 Oct 2026. References: `AGENTS.md`, `apps/api/AGENTS.md`, `packages/contracts/src/interfaces/IGroupVault.sol`, `docs/03-technical-spec.md` › Off-chain database / Invoices.

## Fixed (30 Sep)

1. ✅ **Wrong `getGroup` ABI.** The contract returns one `Group` struct (which contains a `string`); the old ABI listed 8 separate outputs. `struct Group` / `struct Spend` now live in `@tekosue/shared`, locked by `test/unit/abi.test.ts`.
2. ✅ **Custom errors missing from the ABI.** Every `IGroupVault` error is in the shared ABI; "already settled" = `revertErrorName(error) === "GroupNotActive"`.
3. ✅ **Web Push (VAPID) vs Expo.** Replaced by the Expo Push API (`src/integrations/expoPush.ts`), table `push_subs(address, expo_push_token, platform)`, `DeviceNotRegistered` tokens deleted. `VAPID_*` and `web-push` removed; `EXPO_ACCESS_TOKEN` is optional.
4. ✅ **Two DB schemas.** `apps/api/src/db/schema.ts` is the only source; `database/` was removed. Migrations were recreated: `0000_init` + `0001_enable_rls` (RLS with no policy, like the old SQL). **A dev database that ran the old migrations must be reset first** (drop every table + `drizzle.__drizzle_migrations`).
5. ✅ **Profiles didn't match the app.** Now `displayName`, `countryCode` (ISO 2 letters), `city`, `avatarColor` — the same as the shared `profileSchema`.
6. ✅ **Receipts used `noteHash`.** Now `receiptHash` (= `keccak256(ciphertext)` = the value passed to `attachReceipt`), bound to `spend_id` + `mime`, and uploads are refused when the payment doesn't exist on-chain.
7. ✅ **Payment metadata** — `PUT /api/groups/:id/spends/:spendId/meta` only from the spender, `422` when `computeNoteHash` ≠ the on-chain `noteHash`; `GET …/spends/meta`.
8. ✅ **One invoice per member** — built from the `Pulled` / `Refunded` events in the settle receipt; `invoiceHash = keccak256(buildInvoicePayload(...))` from `@tekosue/shared` so the web can rebuild it. `DebtPaid` → `due` becomes `paid`. A 7-day share token for the web page.
9. ✅ **Group meta** — on-chain creator only; public `GET` for the invite screen. (Since ADR 0005 invites are signed keys, so `invite_code_hash` was removed — migration `0002`.)
10. ✅ **`spend_reviews` (P1)** — seen + the decliner's note.

## Decisions made while fixing

- **Trip keys** stay `member_enc_keys` + `group_key_wraps` (the api version), not `group_keys(key_version)` from the draft spec — the flow needs every member's public key and a record of who wrapped what. Key rotation (`key_version`) doesn't exist yet.
- **The invoice hash** only covers the settle result that can be proven from the chain (`pulled`, `refunded`, `remainingDebt`, `remainingCredit`, `settleTxHash`, number). Deposits and per-payment shares are shown from Envio and are not hashed; neither is the status.
- **`countryCode`** is an ISO code; the mobile form stores a country name ("Australia"), so mobile maps name → code before `PUT /api/profiles/me`.
- **Payment metadata is written after the `spend` transaction** (it needs the `spendId`). If the app fails to write the label, the payment still exists on-chain without a title.

## Resolved since (1–6 Oct)

- ✅ **The contract is implemented and deployed** (ADR 0005, then ADR 0013 at `0x02Fb964B6b4470C14D61738EC0a296fa9F2dbCE0`); the api, the indexer and the app run against it on Monad testnet.
- ✅ **Invoices for groups settled by a member** and **`paid` after `DebtPaid`** no longer need Alchemy: the Envio notifier (ADR 0014) handles both events.
- ✅ **The Envio schema** matches the real `packages/indexer/schema.graphql` (`Group`, `Activity`, `Member`, `SpendShare`), checked against the hosted indexer.
- ✅ **The ABI** is generated from `forge build` (`npm run abi -w @tekosue/contracts`).
- ✅ **Building the Docker image from the root** works (built locally and on the VPS, 6 Oct).
- ✅ **Invoice payloads** are built through the same `invoiceSettlementsFromOutcome` as the web verification page, with a property test proving both paths give identical bytes.

## Still open

- **Mobile sign-in on a release build**: the EIP-191 signature through `session.signDigest(hashMessage(message))` → 65 bytes `r‖s‖v` is wired, but still to verify on physical phones with the new APK.
- **Drip without sign-in**: the maximum loss is ≈ `DRIP_DAILY_CAP × DRIP_AMOUNT_MON` per day (default 10 MON). The rate limiter is in memory — fine for one instance.
- **Invoice backfill** runs every sweep for the 50 latest `settle_runs`; `skipped` groups without a transaction in Envio are queried again every tick (cheap, but could be limited).
- **Alchemy webhooks** (optional source) were never tested with a real payload (`webhooks/extract.ts`).
- `src/lib/money.ts` still partly duplicates `@tekosue/shared`.
- No `lint` script in the api.

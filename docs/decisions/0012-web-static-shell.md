# 0012 — Static web with /j and /v shells that load live data (W-3)

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

`/j/[code]` (invite) and `/v/[number]` (invoice verification) in apps/web still used demo data and were only built for demo codes and numbers through `generateStaticParams`. Invite codes (`${groupId}-${64-hex secret}`) and invoice numbers from the app can't be known at build time. The web was also run with `next start`, although the rule is "stay static".

## Decision

- **A real static export** (`output: "export"`). `headers()` is removed from `next.config.ts` (static export doesn't support it); `.well-known` headers move to the host. Images are served unoptimized (no image server).
- **Static shells:** `/j/[code]` and `/v/[number]` each build one placeholder page (`generateStaticParams = () => [{ code: "_" }]`, `dynamicParams = false`) → `/j/_` and `/v/_`. Client components (`InviteView`, `VerifyView`) read the code or number from `window.location` (through `useSyncExternalStore`), not from `params`. This is a deliberate exception to "dynamic routes use `generateStaticParams` per item".
- **Hosting:** `www.tekosue.xyz` is served by **Vercel** (project root `apps/web`). `apps/web/vercel.json` rewrites `/j/:code` → `/j/_` and `/v/:number` → `/v/_` (destinations without `.html`, because the Next build on Vercel serves extensionless routes and a rewrite only applies when its destination exists), serves both `.well-known` files as `application/json`, and sends `Referrer-Policy: no-referrer` for `/j` and `/v`. The same rules exist for self-hosting: `apps/web/Dockerfile` (`next build` → `nginx:1.27-alpine`) with `apps/web/deploy/nginx.conf`, and locally `npm run preview -w @tekosue/web` (`scripts/preview.mjs`, rules shared with `scripts/shell-routes.mjs`).
- **A live data layer** `src/data/live/*`, only for `/j` and `/v`, next to the demo `repo` used by the preview pages (an exception to "data goes through `repo`"). Read-only, from the browser: api `GET /api/groups/:id/meta`, `GET /api/invoices/:number?token=…`, and the public Envio GraphQL endpoint. Every fetch uses `credentials: "omit"`, `referrerPolicy: "no-referrer"` and an 8-second timeout; the shell pages set a `referrer=no-referrer` meta tag. The invite page only sends the `groupId`; the invite secret never leaves the browser.
- **`?token` is read in the browser.** The invoice access key is a credential carried by the link, not display state, so it doesn't break the spirit of "don't use `searchParams` for display state". The QR code, share message and PDF link carry the full URL; the visible text only shows `www.tekosue.xyz/v/<number>`, so the word "token" never appears in the UI. The parameter name lives in one constant marked `copy-guard-ignore`.
- **Verification:** the web rebuilds the invoice payload from Envio with shared functions in `@tekosue/shared` (`settleOutcomeFromActivities` → `invoiceSettlementsFromOutcome` → `buildInvoicePayload` → `computeInvoiceHash`); the api uses the same `invoiceSettlementsFromOutcome` on the settle receipt from RPC. "Matches" only when the payload is identical, the fingerprint is equal and the number is the same; the amounts shown always come from on-chain data.
- **Indexer schema additions:** `Member.position` (the `membersOf` order; the contract's `members[]` only grows) and `Activity.remaining` (`remainingDebt` / `remainingCredit` from `Pulled` / `Refunded`). Without them the payload can't be rebuilt exactly: `Member.debt/credit` are current values, and `joinedAt` can't order two joins in the same block.

## Rejected alternatives

- **The settle receipt + `membersOf` over public RPC from the browser.** Closest to the api, but it breaks "Envio is the read source for money" and depends on public RPC rate limits. Kept as a fallback if the Envio resync failed before the deadline.
- **A Next server (`next start`) with dynamic routes.** Against the static-web rule, and one more Node process to run.

## Consequences

- **Envio needs codegen + a resync from `start_block`** after deploying the new indexer (done 6 Oct). While the new columns are missing or empty, `/v` shows "We can't check this invoice right now" and never "matches".
- `next dev` only knows `/j/_` and `/v/_`; test real codes and numbers with `npm run build && npm run preview`.
- Prefetching RSC segment files (`__next.*.__PAGE__.txt`) returns 404 on a static export with this Next version because the files are written as nested folders; navigation still works.
- The production api's `CORS_ORIGINS` must include `https://www.tekosue.xyz` (empty = open); the public Envio endpoint must be HTTPS and allow that origin.
- Verified end to end on a local stack against testnet (6 Oct): five real invoices "match", a changed access key is rejected, and an edited invoice is reported as "doesn't match".

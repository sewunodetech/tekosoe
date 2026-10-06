# 0011 — Rebrand Tekosoe → Tekosue and the www.tekosue.xyz domain

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

The product's correct name is **Tekosue**; the repo, packages and UI still said "Tekosoe". The passkey/web domain was still `tekosoe.mulalabs.biz.id` (plus leftovers of `tekosoe.xyz`).

## Decision

- All UI text, the wordmark (`tekosue`), the docs and the workspace package names move to Tekosue / `@tekosue/*` (lockfile regenerated).
- The app domain is **`www.tekosue.xyz`**: passkey rpId (`EXPO_PUBLIC_PASSKEY_DOMAIN`), iOS associated domains, Android App Links for `/j/*`, `.well-known`, invite links, invoice verification URLs, the web `SITE_DOMAIN`, the api `CORS_ORIGINS` and `AUTH_DOMAIN`, and `scripts/check-wellknown.mjs`.
  - The site is hosted on Vercel, where the apex `tekosue.xyz` redirects (308) to `www.tekosue.xyz`. Passkeys and App Links need `/.well-known` to answer 200 with no redirect, so the app uses `www`. The apex keeps redirecting visitors to www.
- These identifiers are **kept on purpose** (guarded by `scripts/rebrand-guard.test.mjs`):

| Identifier | Why |
| --- | --- |
| `com.tekosoe.xyz`, `com.daffaradhitya.tekosoe`, the `tekosoe://` scheme, the EAS slug/project `tekosoe` | Native identity; changing it means a new app, and installed APKs only know this scheme |
| `tekosoe.wav`, the `tekosoe-chime` channel, `LEGACY_CHANNEL_IDS` | Notification sound and channel ids built into the native app |
| Device keys `tekosoe_*` (profile, onboarding, tour, invite secrets, PRF, credential id, demo key) | Changing them signs users out and loses trip creators' invite secrets |
| `ENC_KEY_MESSAGE` ("Tekosoe receipts…"), `tekosoe/trip-key-wrap/v1`, AAD `tekosoe/receipt/v1/…` | The receipt key is derived from a signature over this message; changing it makes old receipts unreadable |
| The SIWE statement `"Sign in to Tekosoe."` | Compared with the message installed APKs build; not shown as UI text |
| `SHARE_AUDIENCE = "tekosoe:invoice-share"` | Changing it invalidates invoice access keys already issued (valid 7 days) |
| `tekosoe-indexer` | Internal HyperIndex name |
| Asset file names `tekosoe-mark*.svg`, `tekosoe-logo.svg`, the repo folder | Out of scope |
| Live document titles "Tekosoe — Dokumen Produk" and the "Tekosoe — Wireframe" canvas | External document names; rename them at the source first |
| History in ADRs 0001–0010 and older `docs/STATUS.md` entries | History is not rewritten |

## Consequences

- **Old passkeys no longer work.** They are bound to the rpId `tekosoe.mulalabs.biz.id`; an app with rpId `www.tekosue.xyz` can't find them. Testnet users create a new account; testnet funds at old addresses stay on-chain but can't be reached from the app.
- **A new native build is required** (associated domains and the intent filter are part of the binary): EAS env `EXPO_PUBLIC_PASSKEY_DOMAIN=www.tekosue.xyz` and `EXPO_PUBLIC_WEB_DOMAIN=www.tekosue.xyz`, build the APK, then `npm run check:wellknown -- www.tekosue.xyz --sha256 <EAS fingerprint>`. Checked on 6 Oct: Google Digital Asset Links already links the EAS fingerprint on `www.tekosue.xyz`.
- Passkeys are bound to `www.tekosue.xyz`. Don't move to the apex later without an account migration plan.
- Workspace commands are now `-w @tekosue/<name>`; delete the old `node_modules/@tekosoe` and run `npm install` at the root.
- The GitHub repo moved to `sewunodetech/tekosue` (the old URL redirects).

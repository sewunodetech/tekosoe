# Development status

Maintained by the team and agents. Tick an item only once it's done **and** verified on testnet. Add notes under each phase.

Legend: ✅ done · 🟡 in progress · ⏳ not started

## Timeline

| Dates | Focus | Done when | Status |
| --- | --- | --- | --- |
| 27–29 Sep | Mera spike (passkey + PRF on iOS/Android), AUSD faucet, gas test; contract v0 + unit tests | One AUSD transaction from a Mera account without the user holding MON | 🟡 contract, faucet and gas drip done; Mera still to verify in a release build on phones |
| 30 Sep – 2 Oct | Complete contract + fuzz tests, testnet deployment, Envio indexer | Every event indexed, indexer balances = contract | ✅ GroupVault v1 deployed, indexer hosted and matching the contract |
| 3–6 Oct | App P0: onboarding, trips, deposits, spending, settle-up | Demo scenario end to end on testnet | ⏳ |
| 7–8 Oct | Real-time feed (P1); start encryption (P2) if safe | Feed updates without a manual refresh | ⏳ |
| 9–10 Oct | E2E testing, UX testing with non-crypto users, Slither | Every P0 test passes | ⏳ |
| 11 Oct | Demo video, README, write-up | Final | ⏳ |
| 12 Oct | Submit | Submission complete | ⏳ |

## Repo setup

- [x] npm workspaces + Turborepo monorepo, folder layout per the spec
- [x] Planning documents in `docs/`, agent guide in `AGENTS.md`
- [x] Scaffolds for `apps/mobile` (Expo SDK 57), `apps/web` (Next.js 16), `apps/api` (Hono)
- [x] Express backend (PR #5) moved from `backend/` to `apps/api`; ADR 0004 (proposed)
- [x] api: ABI structs + custom errors in `@tekosoe/shared`, database schema unified in Drizzle (`database/` removed), push through Expo, trip/payment metadata tied to on-chain hashes, invoices after settle-up. 38 api tests pass (fake chain, not yet on testnet). Remaining: `apps/api/docs/coverage.md` › Still open
- [x] Skeletons for `packages/contracts`, `packages/indexer`, `packages/shared` (`database/` removed; the schema lives in `apps/api`)
- [ ] `npm install`, and every workspace passes `typecheck`
- [x] Foundry (WSL) + `forge-std`: `forge build` passes, 26 tests (including fuzz) pass

## Mobile — see `apps/mobile/ROADMAP.md`

- [x] UI for every Final UI screen + the Teko mascot + design system (demo data), branch `mobile-dev`
- [ ] M0 Setup: merge to `main`, Home at `/trips`, `eas.json`, dev build on 2 phones, icons & splash. *Home at `/trips` ✅; app icon, adaptive icon, splash, favicon + web/OG icons from `tekosoe-mark.svg` ✅ (`scripts/brand-assets.mjs`); remaining: merge, `eas.json`, dev build*
- [x] M1 Data layer: `src/data` (demo) + `src/features/*` hooks, loading/error states through `QueryState`. Every screen is decoupled from demo data
- [ ] M2 Mera spike: passkey + sign one transaction in a dev build, ADR with the result. *ADR 0003 + code exist. 4 Oct: passkey + PRF verified in a dev build on Android (Xiaomi, MIUI) with rpId `tekosoe.mulalabs.biz.id` — `.well-known` served from the VPS, signing back in with the same passkey opens the same account (profile + balance). Remaining: sign a transaction, iOS (needs Apple Team ID in AASA), second phone*
- [x] M3 Session & account: Signer, SessionProvider, route gate, real passkey prompt. *Signer, SessionProvider and route gate done. SecureStore blocker resolved (using `requireAuthentication: true`). 4 Oct: 02 Sign in now has an explicit "Create account with Passkey" (new passkey) next to "I already have an account" (existing passkey); sign up no longer depends on a `NoCredentials` fallback, which iOS never returns.*
- [x] Onboarding + first-time tour (4 Oct, outside the Final UI canvas, built from the existing design system): O1–O3 slides on first launch only (O1 = 01 Welcome), 02 Sign in is O4; T1–T6 tour over 03 once per account per device, replay from Help and feedback on P2. Seen flags live on the device only (`lib/device-flags.ts`). Verified in the web demo; still to check on Android/iOS (spotlight positions under edge-to-edge).
- [x] Invite links on `tekosoe.mulalabs.biz.id` (4 Oct): app now builds `https://tekosoe.mulalabs.biz.id/j/<code>` (was `tekosoe.xyz`, EAS had no `EXPO_PUBLIC_WEB_DOMAIN`), Android App Links intent filter for `/j/*`, app route `j/[code]` → 05 Invite, signed-out invitees go through 02 Sign in and back to Join. Web `/j/<code>` shows the real trip name (public api meta) + Android APK link. *Web live on the VPS (Docker + Traefik, `web` service at 1136f59; redeploy: `git pull` in `/home/ubuntu/docker/tekosoe-web`, then `docker compose up -d --build web` in `tekosoe-main`). Needs a new APK for the intent filter. iOS universal links/passkey wait on the Apple Team ID in the AASA.*
- [x] One-tap join ([ADR 0009](decisions/0009-join-without-deposit.md), 4 Oct): "Join with Passkey" on 05 joins right away with no deposit and goes back to Home; the creator picks the safety net for everyone on 04 New trip; 06 Join + put in retired. *Needs a new APK; verify a real join on testnet.*
- [x] Reopening the app with a saved account goes straight to a passkey prompt (Unlock, 4 Oct), no more onboarding/sign-in screen. The PRF is still only cached with strong biometrics; without it (PIN, "weak" face unlock) or after a cancelled prompt, Unlock asks for the passkey. *Needs a new APK; verify on the Xiaomi.*
- [x] Receipt keys spread in the background (4 Oct): Home and 07 Trip run `syncReceiptKeys` (publish this phone's key; if it holds the trip key, wrap it for members who lack one). Before, keys only spread when someone added/opened a receipt, so a member without a copy got "receipt not saved". *Holders need the new APK for this to run.*
- [x] M4 Transactions: `src/tx`, every mutation hook and the Processing → Done feedback modal, friendly errors
- [x] M5 Forms & validation
- [x] M6 Live data: Envio + api adapters. *Code done (`src/data/live`, `EXPO_PUBLIC_DATA_SOURCE=live`), typecheck + lint pass, backend deployed and connected on testnet.*
- [ ] M7 Receipts: camera/PDF, encryption, upload, `attachReceipt`, open R2 → R3. *Code complete (ADR 0008): compress → AES-GCM with the trip key on the phone → presigned upload → `attachReceipt` → R2 checks the on-chain fingerprint and decrypts. Typecheck, lint and crypto round-trip checks pass; demo flow verified. Remaining: verify live on testnet (needs `FEATURE_RECEIPTS` + S3 on the api), multi-page, PDF*
- [x] M8 Invoices: `payDebt`, PDF through expo-print, share, a real QR code linking to web verification
- [x] M9 Invites & deep links: `tekosoe://` scheme, universal links, and the `/j/[code]` web companion
- [ ] M10 Release & QA: banned-word check, accessibility, test on 3 phones, EAS build. *4 Oct: first EAS preview APK on project `@kyy27/tekosoe` ([build](https://expo.dev/accounts/kyy27/projects/tekosoe/builds/6e99c9fa-c6b3-409b-9d08-5984783046ec)); EAS keystore SHA-256 `DE:B1:E6:…:C7:3E` added to `assetlinks.json`; `EXPO_PUBLIC_*` set in the EAS `preview` environment 4 Oct: new preview APK with passkey sign up, onboarding and tour ([build](https://expo.dev/accounts/kyy27/projects/tekosoe/builds/6d4b80d7-94ad-4a01-9d34-a92b4a871e77)).*
- [ ] M11 P1/P2: real-time feed, push, simulated card, PRF key. *Activity screen (`/activity`, ADR 0007) done in demo + live from Envio; Top up / Cash out rows wait for an indexer codegen + redeploy (`BalanceActivity`)*
- [x] P1 Set up profile + P2 Profile designed on the Final UI canvas (28 Sep)
- [ ] M12 Profile & account: P1 screen + P2 tab, saved to `profiles` through the api, Sign out. *P1 UI + P2 tab + gate + Sign out + local save done; api `profiles` wired up in live mode (not yet tested live)*

## Contract, indexer, api (30 Sep)

- [x] GroupVault v1 (ADR 0005): signed invites, a settle-up that frozen AUSD accounts can't block, AUSD permit (join/deposit/payDebt in one transaction), `positionOf`. 26 Foundry tests. **Deployed** at `0x1467c9de54C1e4570AF062E80E860F94852BB7ee` (verified: `ausd()` = Agora AUSD).
- [x] Envio indexer v3: 12 handlers, validated with `codegen` + `tsc`. **Hosted** (Docker, HyperSync, its own database): `isReady`, 17 events, data matches the contract.
- [x] api: ABI from `forge build`, `invite_code_hash` removed (migration 0002). **Deployed** (Docker), `/health` ok.
- [x] Agora AUSD verified (address, 6 decimals, permit, faucet `requestFunds`).

## All teams at a glance (by layer) — see `docs/ROADMAP.md`

### P0 — Must

- [ ] Mera passkey onboarding; sign back in on another device with the same account (FR-01, FR-02)
- [ ] Gas without the user holding MON (FR-03)
- [ ] Create a trip + invite link (FR-04, FR-05)
- [ ] Join + safety net + first deposit (FR-05, FR-06)
- [ ] Spend from the pot + who it's for (FR-07, FR-08)
- [ ] Approval above the limit (FR-09)
- [ ] Share disputes (FR-10)
- [ ] Automatic settle-up through the scheduler + bills (FR-11, FR-12)
- [ ] UI with no crypto terms, amounts in dollars (FR-13)
- [ ] Metadata in the database through the api, hash matches `noteHash`
- [ ] Receipts: encrypted on the phone, `attachReceipt`, opened with a passkey (FR-19, FR-20)
- [ ] Per-member invoice: Paid/Refunded/Due, Pay, PDF (FR-22)

## Web (`apps/web`) — lihat ADR 0004

- [x] W-4 Landing page + dashboard demo hanya-baca (`/`, `/trips`, `/trips/[id]`, members, payment details, settle preview, invoice, `/card`, `/profile`), mobile-only, desain dari app, data demo lewat `TripRepository`
- [x] `/j/[code]` (undangan) dan `/v/[number]` (verifikasi) memakai sistem desain yang sama; `/v` masih data demo
- [x] Rebrand ke **Tekosue** + domain **`tekosue.xyz`** (6 Oct, ADR 0011): paket `@tekosue/*`, rpId passkey/App Links/link undangan/QR invoice di `tekosue.xyz`, identifier native & kunci perangkat lama dipertahankan (`scripts/rebrand-guard.test.mjs`). *Passkey lama di `tekosoe.mulalabs.biz.id` tidak bisa dipakai lagi. Tertunda manual: DNS `tekosue.xyz` → VPS, router Traefik, `CORS_ORIGINS` api produksi, env EAS + APK baru, `npm run check:wellknown -- tekosue.xyz`.*
- [ ] W-1 `.well-known`: Team ID Apple, bundle ID `com.tekosoe.xyz`, `Content-Type: application/json` untuk `apple-app-site-association`
- [ ] 🟡 W-3 Verifikasi invoice nyata + undangan live (6 Oct, ADR 0012): kode selesai dan dites (vitest + fast-check). `/j/<kode>` sudah menampilkan trip nyata dari Envio + api (diuji lokal terhadap testnet: trip 10 "Halan halan", trip 8, trip tidak ada, link salah). `/v/<nomor>?token=` membangun ulang invoice dari Envio dengan `invoiceSettlementsFromOutcome` (sama dengan api) dan mencocokkan payload + sidik jari; app memasukkan kode akses ke QR/share/PDF. Web sekarang static export + nginx (`apps/web/Dockerfile`). *Belum dicentang: butuh deploy indexer baru (`Member.position`, `Activity.remaining`) + sinkron ulang Envio dari `start_block`, deploy image web, lalu uji QR invoice nyata → "cocok" di testnet.*
- [ ] Sambungkan dashboard ke Envio/api (implementasi live `TripRepository`) — menunggu C-6, D-1
- [x] Halaman unduh `/get-app` (6 Oct): gaya landing, tombol "Download for Android" (APK EAS, `NEXT_PUBLIC_ANDROID_APK_URL`), QR untuk laptop, 4 langkah instal, iPhone "coming soon"; `/j/japan` kembali menampilkan undangan contoh

### P1 — Envio

- [ ] HyperIndex indexer for every event
- [ ] Real-time feed (FR-14), balances & settle-up preview (FR-15)
- [ ] Receipt OCR (FR-21); server invoice PDF + email (FR-23)

### P2 — Mera PRF

- [ ] Simulated card (FR-16)
- [ ] Passkey-derived encryption key, trip key (FR-17)

### P3 — Alchemy (dropped, ADR 0014)

- [x] Alchemy removed from the landing page "Built with" (6 Oct). Network fees stay covered by our MON drip.
- [ ] 🟡 Push notifications from **Envio** instead of Alchemy webhooks (6 Oct, ADR 0014): approval requests, payments with your share, declined/disputed payments, settle-up results, and a daily "You still owe $X" reminder (ADR 0013). *Needs `FEATURE_PUSH=true` on the api and a native build (Expo Go on Android has no push). Not yet verified on a phone.*

## Deployments

| Item | Value |
| --- | --- |
| GroupVault v1 + ADR 0013 (Monad testnet, **current**) | `0x02Fb964B6b4470C14D61738EC0a296fa9F2dbCE0`, block 68690383, tx `0x5bdf122866c38f61110388919cca9194cd66a1be887e51b43fd3bf462fd7d6a6` (6 Oct; unpaid debt blocks new trips). Source verification pending |
| GroupVault v1 (old, test data only) | `0x1467c9de54C1e4570AF062E80E860F94852BB7ee`, block 66921819 (source verified, exact match, Sourcify via BlockVision, 3 Oct; built from commit `39827cd`), tx `0xdb7fc5e2da71b71ae27ad0d72025215c52588d8fa93b4243b7987bb913731dcb` |
| AUSD testnet | `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC` (verified: Agora docs + on-chain) |
| AUSD testnet faucet | `0xd236c18D274E54FAccC3dd9DDA4b27965a73ee6C`, `requestFunds(address)` |
| Envio GraphQL | `https://graphql.mulalabs.biz.id/v1/graphql` (`docker-compose.yml`) |
| API | `https://api.mulalabs.biz.id` (`docker-compose.yml`) |
| Sample transactions | createGroup [0x8faaf19c…](https://testnet.monadvision.com/tx/0x8faaf19c87c306a9cef5d6a11e21f089ebb3dc5829b2b21c4d5dddd3936f5962) · joinGroupWithPermit [0x29472de8…](https://testnet.monadvision.com/tx/0x29472de8eca137ba15b599a4e8d771fd3e02eb3df82626535d2d17ebf4519db2) · depositWithPermit [0xf5b3d0d9…](https://testnet.monadvision.com/tx/0xf5b3d0d9b697aadb260a6afa8689ddf6acaf5a58e86aafc6ee69c21fdf9f4bc6) · spend [0x388389f5…](https://testnet.monadvision.com/tx/0x388389f500143088cabd228325bd0911cc593214ac9158b8dc248e9ee56dbe15) · pproveSpend [0x5e44d659…](https://testnet.monadvision.com/tx/0x5e44d659130939566f6b3e06e0fbb4aa554d8222f56616ad1f37981f8bdf7812) · settle [0x46c58b52…](https://testnet.monadvision.com/tx/0x46c58b52fe57d92fbc650d057cef1026d7a5b4dcf122edf237f1b4ef60681ec9) · payDebtWithPermit [0x7cae1e5f…](https://testnet.monadvision.com/tx/0x7cae1e5f89413868dc432b8566526adcf7939564d9dd27fb5e457c1de865483d). All succeeded; function decoded from the transaction input (2 Oct) |

## Blockers and open questions

- Do the Mera SDK and the PRF extension run in React Native? (day-one spike; fallback: an in-app browser on the same domain)
- Alchemy Gas Manager compatibility with Mera EOAs
- No business model chosen yet for the pitch

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
- [ ] M2 Mera spike: passkey + sign one transaction in a dev build, ADR with the result. *ADR 0003 + code exist; not yet verified in a dev build on 2 phones*
- [x] M3 Session & account: Signer, SessionProvider, route gate, real passkey prompt. *Signer, SessionProvider and route gate done. SecureStore blocker resolved (using `requireAuthentication: true`).*
- [x] M4 Transactions: `src/tx`, every mutation hook and the Processing → Done feedback modal, friendly errors
- [x] M5 Forms & validation
- [x] M6 Live data: Envio + api adapters. *Code done (`src/data/live`, `EXPO_PUBLIC_DATA_SOURCE=live`), typecheck + lint pass, backend deployed and connected on testnet.*
- [ ] M7 Receipts: camera/PDF, encryption, upload, `attachReceipt`, open R2 → R3. *Capture UI + `attachReceipt` + passkey unlock done; R1 uses expo-camera + gallery (expo-image-picker), the photo becomes a draft on 09 and is attached after `spend` (demo). Not yet: compress/encrypt/upload, multi-page, PDF*
- [x] M8 Invoices: `payDebt`, PDF through expo-print, share, a real QR code linking to web verification
- [x] M9 Invites & deep links: `tekosoe://` scheme, universal links, and the `/j/[code]` web companion
- [ ] M10 Release & QA: banned-word check, accessibility, test on 3 phones, EAS build
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

### P1 — Envio

- [ ] HyperIndex indexer for every event
- [ ] Real-time feed (FR-14), balances & settle-up preview (FR-15)
- [ ] Receipt OCR (FR-21); server invoice PDF + email (FR-23)

### P2 — Mera PRF

- [ ] Simulated card (FR-16)
- [ ] Passkey-derived encryption key, trip key (FR-17)

### P3 — Alchemy (dropped from scope, see `docs/ROADMAP.md`)

- [ ] Gas Manager with Mera accounts (half a day max)
- [ ] Webhooks → push notifications (FR-18)

## Deployments

| Item | Value |
| --- | --- |
| GroupVault v1 (Monad testnet) | `0x1467c9de54C1e4570AF062E80E860F94852BB7ee`, block 66921819, tx `0xdb7fc5e2da71b71ae27ad0d72025215c52588d8fa93b4243b7987bb913731dcb` |
| AUSD testnet | `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC` (verified: Agora docs + on-chain) |
| AUSD testnet faucet | `0xd236c18D274E54FAccC3dd9DDA4b27965a73ee6C`, `requestFunds(address)` |
| Envio GraphQL | `https://graphql.mulalabs.biz.id/v1/graphql` (`docker-compose.yml`) |
| API | `https://api.mulalabs.biz.id` (`docker-compose.yml`) |
| Sample transactions | createGroup [0x8faaf19c…](https://testnet.monadvision.com/tx/0x8faaf19c87c306a9cef5d6a11e21f089ebb3dc5829b2b21c4d5dddd3936f5962) · joinGroupWithPermit [0x29472de8…](https://testnet.monadvision.com/tx/0x29472de8eca137ba15b599a4e8d771fd3e02eb3df82626535d2d17ebf4519db2) · depositWithPermit [0xf5b3d0d9…](https://testnet.monadvision.com/tx/0xf5b3d0d9b697aadb260a6afa8689ddf6acaf5a58e86aafc6ee69c21fdf9f4bc6) · spend [0x388389f5…](https://testnet.monadvision.com/tx/0x388389f500143088cabd228325bd0911cc593214ac9158b8dc248e9ee56dbe15) · pproveSpend [0x5e44d659…](https://testnet.monadvision.com/tx/0x5e44d659130939566f6b3e06e0fbb4aa554d8222f56616ad1f37981f8bdf7812) · settle [0x46c58b52…](https://testnet.monadvision.com/tx/0x46c58b52fe57d92fbc650d057cef1026d7a5b4dcf122edf237f1b4ef60681ec9) · payDebtWithPermit [0x7cae1e5f…](https://testnet.monadvision.com/tx/0x7cae1e5f89413868dc432b8566526adcf7939564d9dd27fb5e457c1de865483d). All succeeded; function decoded from the transaction input (2 Oct) |

## Blockers and open questions

- Do the Mera SDK and the PRF extension run in React Native? (day-one spike; fallback: an in-app browser on the same domain)
- Alchemy Gas Manager compatibility with Mera EOAs
- No business model chosen yet for the pitch

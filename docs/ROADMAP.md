# Tekosue roadmap (all teams)

The big picture for every team. Per-team detail:
- **Mobile** → [`apps/mobile/ROADMAP.md`](../apps/mobile/ROADMAP.md)
- Contract, indexer, api, database, web → the work packages below; local rules live in each folder's `AGENTS.md`

Progress is ticked off in [`STATUS.md`](STATUS.md). We submit on **12 Oct 2026** (official deadline: 13 Oct, 23:59 ET).

## 1. Goal

**Product v0.1:** the "three friends, three countries, a trip to Japan" scenario runs **end to end on Monad testnet with real AUSD**, with no manual steps behind the scenes:
passkey onboarding → create a trip + invite → join + deposit + safety net → pay from the pot (approval above the limit) → dispute → automatic settle-up on the end date → per-member invoices.

**Competition:** top 3 in the Consumer Products & Payments track and the Agora bounty. Supporting bounties, in priority order: Mera UX, Envio, Mera PRF.

**Definition of done for v0.1** (PRD › Release criteria):
- FR-01 to FR-13 work on testnet, including automatic settle-up.
- Contract unit + fuzz tests pass; Slither with no serious findings.
- No crypto terms on any screen.
- README, demo video and project profile complete.

## 2. Scope

| Layer | What's in it | Bounty |
| --- | --- | --- |
| **P0** | Complete GroupVault contract · Mera onboarding + gas without MON · trips/invite/join/deposit · spend + approval + dispute · automatic settle-up + bills · metadata through the api · encrypted receipts + `attachReceipt` · in-app invoices | Track, Agora, Mera UX |
| **P1** | Envio indexer for all events · real-time feed · balances and settle-up preview from the indexer | Envio |
| **P2** | Simulated card · PRF-derived encryption key + trip key | Mera PRF |

**Out of scope:** approval for every payment · mainnet · currencies other than AUSD · a real card · fiat on/off-ramp.

**Cutting rule:** if a phase slips by more than a day, cut from the lowest layer (P2). P0 is never cut. The next layer only starts once the previous one runs end to end on testnet.

## 3. Phases and work packages

| Phase | Dates | Team | Work packages | Done when |
| --- | --- | --- | --- | --- |
| **0 De-risking** | 28–29 Sep | everyone | Mera in React Native (mobile, WP M2) · AUSD address & faucet · gas option (MON drip / relayer / Alchemy, ADR 0003) · database provider (ADR 0002) | One AUSD transaction from a Mera account without the user holding MON; ADRs 0002 & 0003 accepted |
| **1 Contract** | 28 Sep – 2 Oct | contract | **C-1** trips & deposits · **C-2** spend & approval · **C-3** disputes & receipts · **C-4** settle-up & debt · **C-5** fuzz/invariants + reentrancy + Slither · **C-6** testnet deployment + final ABI in `packages/shared` | The spec's A/B/C example is exact; balance invariants hold; address in `STATUS.md` |
| **2 Data** | 30 Sep – 3 Oct | indexer, backend | **D-1** indexer for all events · **D-2** metadata api + EIP-191 auth + `noteHash` validation · **D-3** gas drip · **D-4** settle-up scheduler + invoices table | `Member.net` in the indexer = `balanceOf` in the contract; a test trip settles automatically |
| **3 Mobile** | 28 Sep – 11 Oct | mobile | M0–M12, see [`apps/mobile/ROADMAP.md`](../apps/mobile/ROADMAP.md) | The judges' demo path runs in live mode on 3 phones |
| **4 Web** | 3–8 Oct | web | **W-1** passkey `.well-known` files (apple-app-site-association, assetlinks.json) · **W-2** an invite page that opens the app · **W-3** invoice verification from a QR code | Native passkeys work on the domain; invite links open the app |
| **5 Test & submit** | 9–12 Oct | everyone | **Q-1** E2E on 3 phones on testnet · **Q-2** UX test with non-crypto users · **Q-3** EAS build · **Q-4** README (addresses, hashes, a section per sponsor, AI disclosure), video ≤ 3 minutes, project profile | The submission checklist in [`07-development-plan.md`](07-development-plan.md) is complete |

## 4. Dependencies and hand-offs between teams

```
C-1..C-5 ─> C-6 deploy + ABI ─┬─> D-1 indexer ─┐
                              └─> D-2 api ─────┼─> Mobile M6 (live data)
Mera spike (M2) ─> gas (D-3) ─> Mobile M3/M4   │
C-4 + D-1 + D-2 ─> D-4 settle-up scheduler ────┴─> Mobile M8 (invoices)
W-1 .well-known ─> Mobile M3 (passkey) & M9 (deep links)
```

Hand-offs are recorded in `STATUS.md` › Deployments and announced to the mobile team:

| Hand-off | From | To |
| --- | --- | --- |
| `GroupVault` address + final ABI in `packages/shared/src/abi/groupVault.ts` | contract | indexer, api, mobile |
| Envio GraphQL URL + entity schema | indexer | mobile |
| api URL + request/response types in `packages/shared` | backend | mobile |
| Passkey domain + `.well-known` files | web | mobile |

The mobile team's detailed data needs are in [`apps/mobile/ROADMAP.md`](../apps/mobile/ROADMAP.md) › section 4.

## 5. Main risks

| Risk | Way out |
| --- | --- |
| Mera / PRF doesn't run in React Native | Decided in the day-one spike; fallback: run the Mera step in an in-app browser on the same domain |
| The testnet AUSD faucet is limited | Ask the Agora team on Discord from day one |
| The backend runs late | Mobile runs in demo mode; live integration catches up 3–6 Oct |
| Time runs out | Cut P2; P0 is never cut |

# Monad Metropolis — Development Plan

_26 Sep 2026_

## Summary and goals

We're building a mobile app for **group money across borders**. Friends, families or teams in different countries chip in, track spending, pay each other and settle up in AUSD, with instant settlement on Monad. Users never see a seed phrase, an extension or a gas token.

**The main story.** Three friends from Indonesia, Singapore and Australia plan a holiday in Japan. Each puts AUSD in from their own country. During the trip they share costs, record spending and pay each other in the app. At the end, settle-up takes seconds, with no international bank transfers. Groups from a single country travelling abroad (Indonesian tourists, for example) are the next market, and paying directly at the destination with a card is on the roadmap.

**The problem.** Bill-splitting apps like Splitwise only record debts (IOUs). Paying them back still takes bank transfers that are slow, expensive and lose money on the exchange rate, especially across borders. Local e-wallets like GoPay don't work across borders at all.

**The solution.** Tracking and paying back happen in one place. The contract holds the group's money, spending is recorded on-chain, and settle-up moves real money (AUSD), not just numbers.

**Hackathon goals**

1. Top 3 in the Consumer Products & Payments track.
2. Win the Agora Cross-Border bounty ($10,000), our main target.
3. Pick up the supporting bounties that fit: Mera UX, Mera PRF, Envio, and Alchemy (optional).

**Product principles**

- Never mention blockchains to users. All they see is a passkey prompt and balances in dollars.
- Every sponsor integration is real on testnet, never a mock.
- One account layer only: Mera. No Privy, no "connect wallet".

## Track and bounty targets

One project, one track (Consumer Products & Payments), five bounties. Each sponsor has a distinct job, so every integration is meaningful and none overlap.

| Target | Prize | Requirement (from the dashboard) | How we meet it | Priority |
| --- | --- | --- | --- | --- |
| Track: Consumer Products & Payments | $30,000 shared by 3 teams | A financial product for non-crypto users, with on-chain rails as the advantage | Cross-border group money with no blockchain terms in the UI | Must |
| Agora: Best Cross-Border Payments App | $10,000 | A mobile app that sends AUSD across borders, with Mera passkey onboarding and instant settlement | A shared pot in AUSD: deposit, spend and automatic settle-up; Mera onboarding; a demo with members in different countries | Must |
| Monad Foundation: Best Mera-Powered UX | $2,500 | Mera as the entire account layer: no seed phrase, extension or custody backend | No other wallet; gas sponsored without the backend holding keys; trip invites by link + passkey | Must |
| Envio: Best Use of Envio | $1,000 | HyperIndex/HyperSync/HyperRPC powering on-chain data for core features | HyperIndex indexes contract events for the activity feed, balances and "who owes whom" | Recommended |
| Monad Foundation: Mera — One Passkey, Many Keys | $2,500 | The most creative non-wallet use of Mera's PRF-derived key material | A passkey-derived encryption key for encrypted spending notes and receipt photos | If time allows |
| Alchemy: Best Projects using Alchemy | $1,000 in credits | A meaningful integration of at least one Alchemy service on Monad | Gas Manager to sponsor gas (or pay gas in AUSD); Webhooks for push notifications | Optional |

**Not targeted:** Mercuryo (the winner's prize is credits, not a bounty) and Privy (it conflicts with Mera as the account layer).

**Each sponsor's job:** Mera = identity and signing; AUSD = money; Monad = settlement; Envio = the data the app reads; Alchemy = gas and notification triggers.

## Layered scope

Scope is built in layers. If time runs out at any layer, what's done is still a complete product we can demo. Never start the next layer until the previous one runs end to end on testnet.

**P0 — Must (track + Agora + Mera UX)**

- [ ] Mera passkey onboarding: create an account and sign back in on another device with the same passkey
- [ ] Gas without the user holding MON (automatic MON drip, our own relayer, or Alchemy)
- [ ] Create a trip with an end date and an approval limit; invite members by link
- [ ] Join while picking a safety net and putting in a first deposit
- [ ] Spend from the pot while it has enough, choosing who it's for; recorded automatically
- [ ] One other member's approval for payments above the limit
- [ ] Participants who weren't part of a payment can dispute their share
- [ ] Automatic settle-up on the end date through a scheduler; bills for any remaining shortfall
- [ ] A UI with no blockchain terms, balances shown in dollars
- [ ] Off-chain metadata in a database behind the backend API: profiles, trip names, payment titles, encrypted receipts; metadata hashes checked against `noteHash`
- [ ] Seller receipts: photo/PDF encrypted on the phone, `attachReceipt` on-chain, opened with a passkey, Receipt/No receipt badges in Activity
- [ ] Per-member invoices after settle-up: Paid/Refunded/Due status, a Pay button for debts, links from every line to its transaction, save as PDF with expo-print

**P1 — Recommended (Envio)**

- [ ] HyperIndex indexer for contract events
- [ ] Real-time trip activity feed
- [ ] Per-member balances and a "who owes whom" summary read from the indexer
- [ ] Receipt OCR with an amount-mismatch warning; server-generated invoice PDFs, email and local-currency estimates

**P2 — If time allows (Mera PRF)**

- [ ] Tekosue card (simulated): a real payment from the pot to a demo shop's address, labelled as simulated, without the Visa logo
- [ ] A passkey-derived encryption key, separate from the signing key
- [ ] Encrypted notes and receipt photos; only hashes or ciphertext on-chain
- [ ] Next step: a trip key that every member can read

**P3 — Optional (Alchemy)**

- [ ] Try Gas Manager with a Mera account (time-boxed to half a day)
- [ ] Webhooks for push notifications on new spending and top-up reminders

**Roadmap (in the pitch, not built)**

- Fiat on-ramp and off-ramp (for example Mercuryo)
- A real card for spending from the pot (for example through a Visa issuing partner)
- Mainnet after an audit

**Out of scope:** approval for every payment, mainnet, a real card, and currencies other than AUSD.

## Architecture and technical design

The app signs transactions with a key from the Mera passkey, a gas sponsor pays the gas, the GroupVault contract moves AUSD, and Envio turns contract events into the data the app reads.

User keys never leave the device. The gas sponsor only pays gas; it never holds user keys or funds.

### Components

| Component | Technology | Responsibility |
| --- | --- | --- |
| Mobile app | TypeScript; Expo (React Native), built with EAS | Onboarding, trips, spending, transfers, settle-up |
| Account layer | Mera (`@category-labs/mera`) | Accounts from passkeys, signing sessions, derived keys for encryption |
| Contract | Solidity + Foundry, OpenZeppelin | Trip vault, balance ledger, spending, transfers, settle-up |
| Money | AUSD on Monad testnet (6 decimals) | Every amount and every settlement |
| Indexer | Envio HyperIndex | Activity feed, per-member balances, history |
| Gas | Alchemy Gas Manager, or a MON drip / our own relayer | Users never hold MON |
| Notifications (optional) | Alchemy Webhooks | Push notifications to members |
| Off-chain database | Postgres + object storage, accessed through the mini backend | Profiles, trip names, payment titles and notes, encrypted receipts, read status, push subscriptions; never balances |

### GroupVault contract (draft functions)

- `createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold)` creates a trip with an end date
- `joinGroup(groupId, inviteSecret, pullCap)` joins and records the safety net (together with an AUSD `approve`)
- `deposit(groupId, amount)` puts money into the pot or tops it up
- `spend(groupId, to, amount, participants, shares, noteHash)` spends from the pot; above the limit it waits for `approveSpend` or `rejectSpend`
- `disputeShare(groupId, spendId)` moves a non-participant's share to the payer
- `settle(groupId)` is called by the scheduler after the end date: collect shortfalls up to each safety net, refund overpayments
- `payDebt(groupId, amount)` pays off a remaining bill

The full specification (state, requirements, a worked example) is in the [technical spec](03-technical-spec.md). The deployed contract is GroupVault v1 ([ADR 0005](decisions/0005-groupvault-v1.md)).

**Events for Envio:** `GroupCreated`, `MemberJoined`, `Deposited`, `SpendRequested`, `SpendExecuted`, `SpendRejected`, `ShareDisputed`, `Settled`, `Pulled`, `Refunded`, `DebtPaid`.

**Security rules:** update state before transfers, `nonReentrant` on every function that moves funds, `SafeERC20`, only members can act, and the trip's net balances must always sum to zero.

### Main flow

1. A user opens an invite link, confirms with their passkey, picks a safety net and puts in a first deposit.
2. Members spend from the shared pot while it has enough and choose who each payment is for; everything is recorded automatically.
3. Big payments wait for another member's approval; participants who weren't involved can reject their share.
4. When the pot runs low, members top it up.
5. On the end date, the scheduler runs settle-up: overpayments are refunded, shortfalls are collected up to each safety net, and anything left becomes a bill.

### Design decisions

- A pure shared pot: anyone can spend until it's empty, regardless of their own deposit. Fairness is worked out at settle-up.
- Approval only for payments above the trip's limit, not every transaction.
- The contract can't take money without permission, so shortfalls are only collected automatically up to the safety net; the rest becomes a bill.
- Amounts are stored in AUSD base units (6 decimals); conversion to dollars happens only in the app.
- Notes and receipts are never stored on-chain as plain text; only hashes or ciphertext.

## Test plan

A scope layer only counts as done when it passes testing at its level and runs end to end on testnet. The most important test is value conservation: AUSD must never be created or lost inside the vault.

### 1. Contract (Foundry)

- [ ] Unit tests for every function: the success path and every `revert`
- [ ] Only members can deposit, spend, approve and dispute
- [ ] Payments are rejected above the pot balance or after the end date
- [ ] Payments above the limit aren't paid until another member approves; payers can't approve themselves
- [ ] Disputes are rejected after the dispute window closes
- [ ] `settle` is rejected before `endsAt + disputeWindow` and can't run twice
- [ ] Settle-up never collects more than `pullCap`; if the balance or allowance is short, the rest becomes `debt`
- [ ] Settle-up reproduces the A, B, C example in the technical spec exactly
- [ ] Fuzz: for random sequences of deposits, payments and disputes, the sum of net balances always equals the pot
- [ ] Fuzz: after settle-up and every `payDebt`, total received = total paid, and the contract holds nothing for the trip
- [ ] Reentrancy test with a malicious token (the only place a mock is allowed)
- [ ] Static analysis with Slither before the final deployment

### 2. Integration (testnet)

- [ ] A Mera account is created and its first transaction succeeds without the user holding MON
- [ ] The same passkey on a second device produces the same address
- [ ] Deposit, spend and settle-up with real AUSD on Monad testnet, with transaction hashes recorded. The scheduler calls settle on time
- [ ] The Envio indexer captures every event, and indexer balances match the contract
- [ ] Time from transaction to the app's feed is measured and recorded
- [ ] (P2) Encrypted notes open for members and stay closed to outside addresses
- [ ] (P3) Alchemy Gas Manager works with a Mera account; if not, the fallback is used

### 3. End to end (the demo scenario)

- [ ] Three accounts on three devices stand in for the friends from Indonesia, Singapore and Australia on holiday in Japan
- [ ] Create a trip with an end date, invite by link, everyone joins with a passkey and puts money in
- [ ] Payments with different participant mixes (everyone; only A and B; only A and C)
- [ ] One member spends more than they put in, and it still works while the pot has enough
- [ ] One large payment is approved by another member; one participant rejects their share
- [ ] (P2) One payment with the simulated card at a demo shop
- [ ] The end date passes and settle-up runs automatically, with nobody pressing a button
- [ ] The final numbers in the app match the math done by hand

### 4. UX (people who don't use crypto)

- [ ] Ask one non-crypto person to start from scratch with no help
- [ ] Note where they get confused and how long the first payment takes
- [ ] The words "wallet", "gas", "seed phrase" and "blockchain" never appear on screen

## Timeline

The submission deadline is 13 Oct, 23:59 ET (14 Oct 2026, 10:59 WIB). We aim to submit on 12 Oct and keep one day in reserve.

| Dates | Focus | Done when |
| --- | --- | --- |
| 27–29 Sep | De-risking: Mera spike, testnet AUSD faucet, gas test (Alchemy time-boxed to half a day); contract v0 + unit tests | One AUSD transaction from a Mera account succeeds without the user holding MON |
| 30 Sep – 2 Oct | Complete contract + fuzz tests, testnet deployment, Envio indexer | Every event indexed; indexer balances match the contract |
| 3–6 Oct | App: onboarding, trips, deposits, spending, transfers, settle-up (P0) | The demo scenario runs end to end on testnet |
| 7–8 Oct | Real-time feed (P1); start encrypted notes (P2) if P0 and P1 are safe | The feed updates without a manual refresh |
| 9–10 Oct | End-to-end testing, UX testing with non-crypto people, fixes, Slither | Every P0 test passes |
| 11 Oct | Record the demo video, write the README and write-up | Final video and README |
| 12 Oct | Submit | Submission shows as complete, not draft |
| 13 Oct | Emergency buffer only | — |

Ground rule: if a phase slips by more than a day, cut from the bottom layer (P3, then P2), never from P0.

## Submission checklist and rubric

Per the official FAQ, the submission is a working product with a public project profile: a demo, a short write-up and a link to the code. Judges must be able to verify what was built during the six weeks of the hackathon.

### Track rubric (to be checked against the Rules on the dashboard)

We expect five equally weighted criteria (20% each). How we answer each one:

| Criterion | Evidence that must be visible |
| --- | --- |
| Product quality and completeness | The demo scenario runs end to end, not just the happy path |
| Technical excellence | Unit + fuzz tests pass, Slither is clean, the repo is tidy |
| Monad integration | Real testnet transactions in the video, contract address and hashes in the README, an explicit "why Monad" |
| Track fit | No crypto terms in the UI; non-crypto users can use it unaided |
| Innovation and impact | Real cross-border money, not just IOUs; encrypted receipts |

### "Why Monad" for the write-up

- Fast finality, so transfers and settle-up feel instant.
- Low fees, so even a small expense is worth recording on-chain.
- Several members can record spending at the same time without waiting on each other.

### Before submitting

- [ ] A public GitHub repo with an open-source licence and commit history across the hackathon
- [ ] README: how to run it, testnet contract addresses, sample transaction hashes, architecture
- [ ] README: one section per sponsor explaining the integration (Agora, Mera, Envio, Alchemy)
- [ ] README: disclosure of AI tools and any pre-existing code used
- [ ] A public demo video showing the product working and real Monad transactions
- [ ] Project profile on the dashboard: name, description, track and every targeted bounty selected
- [ ] No private keys, API keys or other secrets in the repo
- [ ] Submission status checked: complete, not draft

### Demo video script (3 minutes max)

1. **0:00–0:30** The problem: three friends from Indonesia, Singapore and Australia on holiday in Japan; sharing costs and paying each other across borders is slow, expensive and messy.
2. **0:30–2:00** Live demo: invite by link, passkey sign-in, AUSD deposits from three countries, recording spending in Japan, paying each other, settle-up at the end of the trip.
3. **2:00–2:30** Under the hood: Mera, AUSD, the contract on Monad, the feed from Envio.
4. **2:30–3:00** Impact and roadmap: tour groups from one country, a card for spending at the destination, on-ramp, mainnet.

## Risks and open questions

The biggest risk is Mera: its documentation is thin, and the whole app depends on it. That's why the Mera spike was scheduled for day one.

### Risks

| Risk | Impact | Fallback |
| --- | --- | --- |
| The Mera API is poorly documented; AI coding agents may invent functions that don't exist | Onboarding slips | Study public repos with working integrations; verify every function in the package source |
| Alchemy Gas Manager doesn't work with Mera EOAs | The Alchemy bounty is lost | MON drip or our own relayer; testing time-boxed to half a day |
| The testnet AUSD faucet is unavailable or rate-limited | The demo is delayed | Ask the Agora team on Discord from day one |
| The Mera SDK or the passkey PRF extension doesn't run in React Native yet | Onboarding and receipt encryption are blocked | Day-one spike: passkey + PRF on iOS and Android; fallback: run the Mera step in an in-app browser on the same domain |
| Sharing encryption keys between members is harder than expected | A weak Mera PRF entry | Ship per-user encryption first |
| Five bounties is too much scope for the time left | The core product isn't polished | Cut P3, then P2, never P0 |

### Questions to verify against the official rules

- [ ] Can one project win several bounties?
- [x] Does a PWA or responsive web app count as a "mobile app" for the Agora bounty? No longer relevant: we decided to build natively with Expo.
- [x] Is testnet accepted for the track and every bounty?
- [x] Is open source required? (The public FAQ says it's encouraged; we keep the repo public regardless.)
- [ ] The official demo video length limit and track judging criteria
- [x] The AUSD faucet address on Monad testnet

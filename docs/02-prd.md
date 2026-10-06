# Tekosue — Product Requirements Document (PRD)

## Summary and product goals

The hackathon version of Tekosue (v0.1) is a shared pot that settles up by itself. Three people in three countries put AUSD into one pot and spend from it until it runs out. On the trip's end date, the contract works out who owes whom and pays everyone back. It all runs on Monad testnet, and all anyone needs is a passkey.

**Product statement.** For friends and families spread across countries, Tekosue is a group pot that records *and* settles shared spending in digital dollars, in seconds, with no bank and no crypto knowledge.

**v0.1 product goals**

1. Go from an invite link to trip member in one flow, with no seed phrase and no gas token.
2. Let any member spend from the pot while there is money in it. The only thing they record is who the payment was for.
3. Move every dollar in AUSD, final within seconds.
4. Settle up automatically on the end date, with a result that matches the math done by hand.

## Personas and user journey

The demo uses three personas from our main story: three friends from Indonesia, Singapore and Australia on holiday in Japan.

| Persona | Role in the trip | What they need |
| --- | --- | --- |
| Friend from Indonesia | Creates the trip, often pays on the spot | Create a trip fast, invite friends, record spending on the go |
| Friend from Singapore | Member | Join without hassle and know what they owe |
| Friend from Australia | Member, has never used crypto | Sign in with a passkey and never meet a crypto term |

**User journey**

| Stage | What the user does | What happens behind the scenes |
| --- | --- | --- |
| 1. Before the trip | The creator sets up "Japan Trip", picks an end date and shares the link | Mera account from a passkey; `createGroup` |
| 2. Joining | A member opens the link, confirms with their passkey, picks a safety net and puts in a first deposit | `joinGroup` + AUSD `approve` for the safety net; AUSD `deposit`; gas sponsored |
| 3. Spending | A member pays from the pot (paying back a friend who covered something, or paying someone else) and picks who it was for | `spend`; recorded automatically; feed updated through Envio |
| 4. Big payments | A payment above the trip's limit waits for one other member to approve it | `spend` with status Pending, then `approveSpend` |
| 5. Paying at a shop (P2) | A member taps the Tekosue card (simulated) at a demo shop | `spend` from the pot to the demo shop's address |
| 6. Disputes | A member who wasn't part of a payment rejects their share | `disputeShare` within the dispute window |
| 7. Pot running low | The app nudges members to top up | Additional `deposit` |
| 8. End date | Nobody has to do anything. Every member gets a summary and any refund automatically | The scheduler calls `settle`; shortfalls are pulled up to each safety net; overpayments are refunded |
| 9. Remaining debt | A member who owes more than their safety net pays the rest | `payDebt` |

## Functional requirements

Priorities follow the scope layers: P0 is required for the track and main bounties, P1 is Envio, P2 is Mera PRF, P3 is Alchemy.

| ID | Requirement | BRD | Priority |
| --- | --- | --- | --- |
| FR-01 | Users create an account with a passkey (Face ID, fingerprint or PIN), with no seed phrase | BR-01 | P0 |
| FR-02 | Users sign back in on another device with the same passkey and get the same account | BR-01 | P0 |
| FR-03 | Users transact without ever holding or buying a gas token | BR-01, BR-07 | P0 |
| FR-04 | Users create a trip with a name, an end date and an approval limit | BR-03 | P0 |
| FR-05 | Users invite members by link; invitees join with a passkey and pick a safety net | BR-03, BR-05 | P0 |
| FR-06 | Members add AUSD to the pot any time before the end date | BR-02, BR-03 | P0 |
| FR-07 | Members spend from the pot while it has enough money, regardless of how much they put in themselves | BR-10 | P0 |
| FR-08 | Every payment records the recipient, the amount and who it was for (all members by default, split evenly or by hand) | BR-04, BR-10 | P0 |
| FR-09 | Payments above the trip's limit need one other member's approval | BR-07 | P0 |
| FR-10 | Participants can reject their share within the dispute window; that share moves to the person who paid | BR-04 | P0 |
| FR-11 | On the end date, settle-up runs automatically: shortfalls are pulled up to each safety net, overpayments are refunded | BR-05 | P0 |
| FR-12 | A shortfall beyond the safety net becomes a bill the member can pay in the app | BR-05 | P0 |
| FR-13 | Every amount is shown in dollars, with no crypto terms | BR-01 | P0 |
| FR-14 | The trip's activity feed updates without a manual refresh | BR-04 | P1 |
| FR-15 | Each member's position (put in, spent, net) and a preview of the settle-up | BR-04, BR-05 | P1 |
| FR-16 | A Tekosue card (simulated) to pay a demo shop straight from the pot | BR-11 | P2 |
| FR-17 | Notes and receipt photos are encrypted with a passkey-derived key; only members can open them | BR-08 | P2 |
| FR-18 | Push notifications for new payments, approval requests and settle-up results | BR-04 | P3 |
| FR-19 | The payer can attach the seller's receipt (photo or multi-page PDF) when paying or later; the receipt is encrypted on the phone and its fingerprint is recorded on-chain with `attachReceipt` | BR-04, BR-08 | P0 |
| FR-20 | Members open receipts with their passkey; Activity marks each payment "Receipt" or "No receipt"; approvers see a warning when a large payment has no receipt | BR-04, BR-08 | P0 |
| FR-21 | On-device OCR reads the amount, shop and date from a receipt and warns when the amount doesn't match the payment | BR-04 | P1 |
| FR-22 | After settle-up, each member gets an in-app invoice with status Paid, Refunded or Due; every line links to its transaction; a Due invoice has a Pay button that calls `payDebt`; invoices can be saved as PDF with expo-print | BR-04, BR-05 | P0 |
| FR-23 | A server-generated invoice PDF sent by email, with an estimate in local currency (rate locked at settle-up, labelled "approx.") | BR-05 | P1 |

## Non-functional requirements

The targets below are the team's goals for the demo, not guarantees. Real numbers are measured during integration testing.

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-01 | Security | User keys never leave the device; no backend stores keys or funds |
| NFR-02 | Security | Contract: state changes before transfers, `nonReentrant`, `SafeERC20`, only members can act |
| NFR-03 | Integrity | The sum of all members' net balances always equals the pot, and the pot always equals the trip's AUSD balance in the contract |
| NFR-04 | Privacy | Notes and receipts are never stored on-chain as plain text |
| NFR-05 | Performance | A payment appears in every member's feed within a few seconds (measured during testing) |
| NFR-06 | Usability | A non-crypto tester completes their first payment without help |
| NFR-07 | Usability | The words "wallet", "gas", "seed phrase" and "blockchain" never appear on screen |
| NFR-08 | Platform | Native iOS and Android app, built with Expo (React Native) |
| NFR-09 | Verifiability | Contract addresses and testnet transaction hashes are listed in the README; the repo is public with its commit history from the hackathon |

## Success metrics and release criteria

v0.1 is ready to submit when every P0 requirement passes testing and the demo scenario runs end to end on testnet with no manual steps behind the scenes.

**Metrics measured during testing**

- Time from opening an invite link to being a member.
- Time from sending a payment to it appearing in other members' feeds.
- Number of steps where a non-crypto tester asks for help (target: zero).
- Difference between the app's settle-up and the math done by hand (target: zero).

**v0.1 release criteria**

- [ ] FR-01 to FR-13 work on Monad testnet, including automatic settle-up
- [ ] Contract unit and fuzz tests pass; Slither scan with no serious findings
- [ ] The three-country scenario runs end to end with real testnet AUSD
- [ ] No crypto terms on any screen
- [ ] README, demo video and project profile on the dashboard are complete

## Out of scope and next phases

These features are deliberately left out of v0.1 so the core product ships polished before the deadline.

| Feature | Why it waits | Phase |
| --- | --- | --- |
| Approval for every payment | Too much friction; approval above the trip's limit is enough | Not planned |
| Fiat on-ramp and off-ramp (for example Mercuryo) | Not a bounty; needs a partner integration and KYC | After the hackathon |
| A real card (for example through a Visa issuing partner) | Needs a card issuer and KYC; the demo uses a simulated card | After the hackathon |
| Currencies other than AUSD | Not needed for the core use case | After the hackathon |
| Mainnet | The contract hasn't been audited | After an audit |

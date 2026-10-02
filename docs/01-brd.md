# Tekosoe — Business Requirements Document (BRD)

_27 Sep 2026_

Tekosoe is a mobile app for group money across borders. Friends chip in, track spending, pay each other and settle up in AUSD, with instant settlement on Monad, and nobody has to understand blockchains to use it.

## Background and business problem

People who travel or do things together across borders have no easy way to manage shared money. Tracking and paying happen in different places, and the paying part is slow and expensive.

**How it works today**

- Bill-splitting apps like Splitwise only record debts (IOUs). Paying them back still means a bank transfer.
- International bank transfers are slow, charge fees and lose money on the exchange rate.
- Local e-wallets like GoPay only work in one country, so friends from other countries can't use them together.
- Crypto apps do cross borders, but they still demand seed phrases, browser extensions and gas tokens. That shuts out everyday users.

**Example.** Three friends from Indonesia, Singapore and Australia go on holiday in Japan. They have to log who paid for what, work out who owes whom, and then send each other bank transfers across three countries once the trip is over.

## Business goals and success measures

In the short term we want to win Monad Metropolis. In the long term we want to turn Tekosoe into a real product through a residency program and support from the Monad ecosystem.

| Goal | Success measure | Horizon |
| --- | --- | --- |
| Top 3 in the Consumer Products & Payments track | Winners announced 3 Nov 2026 | Hackathon |
| Win the Agora Cross-Border bounty | Every bounty requirement is met and visible in the demo | Hackathon |
| Win the supporting bounties (Mera UX, Mera PRF, Envio, Alchemy) | Real testnet integrations, each explained per sponsor in the README | Hackathon |
| Prove everyday users can use it unaided | One non-crypto tester completes a first payment with no help | Hackathon |
| Get a residency invitation and ecosystem support | Invitation from the Monad Foundation | After the hackathon |
| Be ready for real money | Audited contract, mainnet deployment, fiat on-ramp and off-ramp | After the hackathon |

## Target users and stakeholders

Our primary users are groups of friends from different countries who travel or do things together, and who don't use crypto.

**User segments**

| Segment | Need | Priority |
| --- | --- | --- |
| Friends from several countries on holiday together | Chip in and pay each other across borders without banks | Primary (demo focus) |
| A group from one country travelling abroad | A shared pot for spending at the destination | Next (needs a card) |
| Families or teams spread across countries | A shared pot for events or recurring costs | Next |

**Stakeholders**

| Who | What they care about |
| --- | --- |
| End users | Money that is safe, arrives fast and is easy to use |
| Track judges | Product quality, technical depth, Monad integration, track fit, innovation |
| Agora (AUSD) | AUSD used for cross-border payments |
| Monad Foundation / Category Labs (Mera) | Mera as the entire account layer; creative use of passkey-derived keys |
| Envio | HyperIndex data powering core features |
| Tekosoe team | Win the hackathon and keep building the product |

## Value proposition and differentiation

Tekosoe brings tracking and paying back together. What moves is real money in digital dollars, across borders, in seconds.

| | Splitwise | Local e-wallet (GoPay) | Bank transfer | Tekosoe |
| --- | --- | --- | --- | --- |
| Tracks group spending | Yes | Limited | No | Yes |
| Moves real money | No (IOUs only) | Yes, in one country | Yes | Yes |
| Works across borders | Records only | No | Slow, with fees and FX loss | Yes, in AUSD |
| Settlement speed | Depends on the bank | Instant, in one country | Days | Seconds |
| Needs crypto knowledge | No | No | No | No, just a passkey |
| A third party holds the money | n/a | Yes | Yes | No. Funds sit in the contract, keys stay on the user's phone |

**What sets us apart**

Tekosoe is a shared pot that settles up by itself. Members spend from one pot until it runs out. On the trip's end date, the contract works out who owes whom and pays everyone back.

- Real money changes hands, not just a list of debts.
- One currency (AUSD) for every member, so nobody loses money on exchange rates between friends.
- Sign in with a passkey (Face ID, fingerprint or PIN). No seed phrase, no gas token.
- Spending notes and receipts are encrypted, so the group's spending isn't public.

## High-level business requirements

Each business requirement below becomes one or more functional requirements in the PRD.

| ID | Business requirement | Why |
| --- | --- | --- |
| BR-01 | Users can start with zero crypto knowledge: no seed phrase, extension or gas token | Everyday users are the target; required by the track and the Mera UX bounty |
| BR-02 | Every amount of money is in AUSD | One currency across borders; required by the Agora bounty |
| BR-03 | Members in different countries can pay into and spend from one shared pot | The heart of the cross-border use case |
| BR-04 | Every payment from the pot is visible to members, and people who weren't part of it can dispute it | Trust without a middleman |
| BR-05 | On the trip's end date, balances settle automatically with real money | What separates us from debt-tracking apps |
| BR-06 | Payments complete in seconds | Agora's "instant settlement" requirement; what separates us from banks |
| BR-07 | Nobody but the contract holds user keys or funds; large payments need another member's approval | Safety, and the "no custody backend" requirement |
| BR-08 | Spending notes and receipts are not publicly readable | Privacy; the Mera PRF bounty |
| BR-09 | Every sponsor integration runs for real on Monad testnet | Required for bounty judging |
| BR-10 | Anyone can spend from the pot until it runs out, and every payment is recorded automatically | The core shared-pot idea |
| BR-11 | The demo shows paying at a shop straight from the pot with a simulated card | Shows the product vision; a real card is on the roadmap |

## Business model, constraints and assumptions

We haven't chosen a business model and don't need one for the hackathon, but investor judges will probably ask.

**Business model candidates (proposed, not decided)**

- A small fee per settle-up or per cross-border transfer.
- A commission on fiat on-ramp and off-ramp through partners.
- Revenue from a card for spending at the destination.

**Constraints**

- Submission deadline: 13 Oct 2026, 23:59 ET.
- Monad testnet only; no real money during the hackathon.
- Mera is the only account layer; no Privy or other wallets.
- On-ramp and off-ramp (for example Mercuryo) are roadmap only. The card is simulated in the demo; a real card (for example through a Visa partner) is on the roadmap.

**Assumptions**

- AUSD and its faucet are available on Monad testnet.
- Mera works on mobile devices with synced passkeys.
- Gas can be sponsored without the backend holding user keys.

**Open questions**

- [ ] Which business model do we pitch?
- [x] Native app (Expo/React Native) or PWA? Decided: native, with Expo.
- [ ] Regulatory requirements for cross-border transfers on mainnet

## Related documents

- Product requirements: [PRD](02-prd.md)
- Technical specification: [Technical spec](03-technical-spec.md)
- User stories: [User stories](04-user-stories.md)
- Development plan, testing, timeline and submission checklist: [Development plan](07-development-plan.md)

# Tekosoe — User Stories and Acceptance Criteria

A story is done when every acceptance criterion passes on Monad testnet. FR numbers refer to the [PRD](02-prd.md).

## Epic 1 — Onboarding (P0)

**US-01. As a new user, I want to create an account with a passkey, so I never have to deal with a seed phrase.** (FR-01, FR-03)

- [ ] The account exists after a single passkey prompt
- [ ] No seed phrase screen, no extension, no request to buy a gas token
- [ ] The first payment succeeds even though the account holds no MON

**US-02. As a user, I want to sign in on another phone and see the same account.** (FR-02)

- [ ] The same passkey on a second device gives the same address
- [ ] The same trips and balances show up on the second device

## Epic 2 — Trips (P0)

**US-03. As a trip creator, I want to create a trip with an end date and share an invite link.** (FR-04, FR-05)

- [ ] The trip is created with a name, an end date and an approval limit
- [ ] The end date must be in the future
- [ ] The invite link can be shared through any chat app

**US-04. As an invited friend, I want to join with my passkey and put money in right away.** (FR-05, FR-06)

- [ ] From link to member with nothing but a passkey
- [ ] I pick a safety net, explained as "the most the trip can collect from you if you're short at the end"
- [ ] A link with the wrong secret is rejected; a trip has at most 10 members

## Epic 3 — The shared pot (P0)

**US-05. As a member, I want to put money in or top up the pot any time before the trip ends.** (FR-06, FR-13)

- [ ] The deposit goes into the pot and is recorded as mine
- [ ] Amounts are shown in dollars with no crypto terms

**US-06. As a member, I want to keep spending from the pot even after my own deposit is used up, as long as the pot has money.** (FR-07, FR-08)

- [ ] A payment succeeds as long as it doesn't exceed the pot, whatever I put in
- [ ] A payment is rejected when the pot is short, and the app offers "Add money"
- [ ] I choose who it was for: everyone by default, or some people (for example only A and C), split evenly or by hand
- [ ] The shares must add up to the amount
- [ ] The payment is recorded in the contract automatically; there is no separate logging step

**US-07. As a member, I want big payments approved by someone else, so the pot stays safe.** (FR-09)

- [ ] A payment above the trip's limit waits for approval
- [ ] Any one member other than the payer can approve or reject it
- [ ] An approved payment is paid immediately; a rejected one leaves the pot untouched

**US-08. As a member who wasn't part of a payment, I want to reject my share of it.** (FR-10)

- [ ] The reject button is only available to participants, during the dispute window
- [ ] My share moves to the payer, and both our balances update accordingly

## Epic 4 — Automatic settle-up (P0)

**US-09. As a member, I want every balance to settle automatically on the end date without me doing anything.** (FR-11)

- [ ] Settle-up runs automatically after the end date and the last dispute window
- [ ] Whoever overpaid gets the difference straight to their account
- [ ] Whoever underpaid is charged automatically, up to their safety net
- [ ] The result matches the math done by hand (see the A, B, C example in the [technical spec](03-technical-spec.md))

**US-10. As a member who owes more than my safety net, I want to see and pay my bill.** (FR-12)

- [ ] The bill shows the amount and who the money will go to
- [ ] Payment goes straight to the members who are still owed

## Epic 5 — Real-time activity (P1)

**US-11. As a member, I want to see activity and the settle-up preview without refreshing.** (FR-14, FR-15)

- [ ] Deposits, payments, approvals and rejections appear in every member's feed
- [ ] Each member's position (put in, spent, net) matches the contract

## Epic 6 — Simulated card (P2)

**US-12. As a member, I want to pay at a shop straight from the pot with the Tekosoe card.** (FR-16)

- [ ] Paying the demo shop really debits the pot on testnet
- [ ] I still choose who the payment was for
- [ ] The card screen is labelled "Card (simulated)" and doesn't use the Visa logo

## Epic 7 — Privacy (P2)

**US-13. As a member, I want notes and receipts to be unreadable to outsiders.** (FR-17)

- [ ] On-chain storage holds only hashes or ciphertext
- [ ] Trip members can open notes; addresses outside the trip can't

## Epic 8 — Notifications (P3)

**US-14. As a member, I want to be notified about new payments, approval requests and settle-up results.** (FR-18)

- [ ] Notifications reach the members involved

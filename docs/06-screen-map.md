# Screen map

Every screen on the Final UI canvas: what it's for, where people come from, where its buttons lead, and which contract calls or data it uses. Screen names and button labels match the app exactly. Main demo path: 01 → 02 → 03 → 07 → 09 → S2 → 10 → S1 → 13 → I1.

## Sign in and join (01–06)

People create an account with a passkey, then start a trip or join one through an invite link.

| Screen | Purpose | Comes from | Leads to | Contract & data |
| --- | --- | --- | --- | --- |
| 01 Welcome | Introduces the product: "One pot for the whole trip". Teko pours into three glasses for members from three countries | First launch | Get started → 02; I already have an account → 02 | — |
| 02 Sign in | Create an account or sign in with a passkey (Mera). Teko winks | 01 | Continue with Passkey → P1 (new account) or 03 (returning); back → 01 | Mera: passkey → address; gas drip to new accounts |
| 03 Home | Trip list: active trip card (pot, your balance, members' countries), settled trips, tips from Teko | P1 (new account); 02 (returning); Trips tab; back from 04 and 07 | Japan Trip card → 07; New trip → 04; Card tab → 12 | Envio: pot and balance per trip; database: trip names |
| 04 New trip | Create a trip: name, end date, approval limit, invite link | 03; Plan another trip on 13 | Create trip → 07; Copy link / Share → 05; back → 03 | `createGroup`; database `group_meta` |
| 05 Invite | What a friend sees when they open the link: who invited them, members, pot, approval limit. Teko "love" | 04; Invite more friends on S6 | Join with Passkey → 06 | Database `group_meta`, `profiles` |
| 06 Join + put in | Join, choose a first deposit and a safety net | 05 | Join and put in $100 → 07; back → 05 | `joinGroupWithPermit` (deposit + safety net in one transaction) |

## Trip and payments (07–12)

Screen 07 is the hub of a trip. Every money action starts here and comes back here.

| Screen | Purpose | Comes from | Leads to | Contract & data |
| --- | --- | --- | --- | --- |
| 07 Trip | The trip hub: pot, your balance, an "If we settled today" preview, activity with Receipt / No receipt badges | 03; 04; 06; back from 08, 09, 11, 12, S2, S3, S4 | Add money → 08; Pay → 09; Card → 12; Dinner in Shibuya → 11; back → 03 | Envio: pot, balances, feed; database: titles and receipt status |
| 08 Add money | Put more money into the pot. Teko "fill", with coins dropping in | 07; S1 | Add $50 to the pot → 07; close → 07 | `depositWithPermit` |
| 09 Pay from pot | Pay from the pot: amount, recipient, who it's for (equal/custom), receipt. Above the limit, Teko looks worried | 07; S3 (Change the request); R1 (Use photo) | Add receipt photo → R1; Request approval → S2; close → 07 | `spend` (above the limit it becomes `SpendRequested`); `attachReceipt` |
| 10 Approval | On Rina's phone: review the $150 request, her share and the receipt, then decide. Teko "think" | S2 (demo button "Rina's phone") | Approve → S1; Decline → S3; close → S2 | `approveSpend` / `rejectSpend` |
| 11 Payment details | One payment in full: who paid, the split, the receipt, on-chain proof, a dispute button | 07 | Open (receipt) → R2; I wasn't part of this → 07; back → 07 | `disputeShare`; Envio `SpendExecuted` |
| 12 Card (simulated) | A simulated card that pays demo shops from the pot | 07; Card tab on 03 | Konbini Shibuya → 07; Tokyo Taxi → S4; back → 07 | `spend` to the demo shop's address (real testnet AUSD) |

## Seller receipts (R1–R3)

Receipts are attached from the payment screen and opened from payment details. Only trip members can read them.

| Screen | Purpose | Comes from | Leads to | Contract & data |
| --- | --- | --- | --- | --- |
| R1 Add receipt | Snap a receipt or upload a PDF, several pages if needed; encrypted on the phone before upload | 09 (Add receipt photo) | Use photo → 09; Retake → R1; close → 09 | Object storage `receipts` (ciphertext); `attachReceipt` → `ReceiptAttached` |
| R2 Receipt, locked | The receipt is still locked: a blurred preview, who attached it, its fingerprint on Monad | 11 (Open) | Unlock with Passkey → R3; back → 11 | Database `receipts`, `group_keys`; Envio `ReceiptAttached` |
| R3 Receipt, unlocked | The receipt is open on this phone, with a check that its fingerprint matches the chain | R2 | Done → 11; back → 11 | Decrypted on the phone with the trip key (Mera PRF) |

## Settle-up and invoices (13, I1–I3)

On the end date the scheduler calls `settle`. Every member then gets an invoice with one of three statuses.

| Screen | Purpose | Comes from | Leads to | Contract & data |
| --- | --- | --- | --- | --- |
| 13 Settled | The settle-up result: what comes back to you, every member's position, where each shortfall was covered from. Confetti and Teko "cheer" | S1 (Preview settle-up) | See your invoice → I1; Plan another trip → 04 | `settle`; Envio `Settled`, `Pulled`, `Refunded` |
| I1 Invoice · Refunded | Jack's invoice: deposits, his share of each payment, a $20 refund. Every line links to its transaction; a QR code for verification | 13 | Line → Monad explorer; Save as PDF; Share; back → 13 | Envio (numbers), database `invoices` (number, status, hash) |
| I2 Invoice · Due | The variant on Wei's phone: the safety net covered only $5 of $10, so $5 is still due | 13 (variant) | Pay $5.00 → I3 (status after paying); back → 13 | `payDebtWithPermit` → `DebtPaid`; status turns Paid |
| I3 Invoice · Paid | Rina's invoice: $10 short, fully covered by her safety net, nothing to pay | 13; I2 after Pay | Save as PDF; Share; back → 13 | Envio `Pulled`; database `invoices` |

## Edge cases (S1–S6)

Screens for when things leave the happy path. Each one always has a way back to the trip.

| Screen | Purpose | Comes from | Leads to | Contract & data |
| --- | --- | --- | --- | --- |
| S1 Pot is empty | The pot is at $0 after the train tickets were approved: payments and the card pause. Teko "sleep" | 10 (Approve) | Add money to the pot → 08; Preview settle-up → 13; back → 03 | Envio: pot = 0 |
| S2 Waiting for approval | Status of the $150 request: who has seen it and who hasn't; the money stays in the pot. Teko "think" | 09 (Request approval) | Demo: open on Rina's phone → 10; Nudge → S2; Cancel request → 07; back → 07 | Envio `SpendRequested`; database `spend_reviews` (Seen); push |
| S3 Request declined | Wei declined with a note; no money left the pot. Teko "sad" | 10 (Decline) | Change the request → 09; Back to the trip → 07 | Envio `SpendRejected`; database `spend_reviews` (note) |
| S4 Offline | The taxi payment failed because the phone was offline, with a clear "you weren't charged twice" | 12 (Tokyo Taxi) | Try again → 07; Back to the card → 12 | Nothing was sent; no on-chain change |
| S5 Home · 6 people, 5 countries | Home for a big group: 3 avatars + "+3", text "Indonesia · Singapore · +3 more" | Variant of 03 | Avatar row → S6; New trip → 04; Card tab → 12 | Envio `MemberJoined`; database `profiles` |
| S6 Trip members | The full member list with countries; room for 4 more | S5 | Invite more friends → 05; back → S5 | Database `profiles`; 10-member limit in the contract |

## Account and profile (P1–P2, B1–B2, A1)

Right after the first passkey is created, people fill in their profile (P1) before reaching Home. The names, cities and countries shown on Invite, Members and Home come from here.

| Screen | Purpose | Comes from | Leads to | Contract & data |
| --- | --- | --- | --- | --- |
| P1 Set up profile | Once, after the first passkey: name, city, country, avatar colour. Teko "wink" | 02 (Continue with Passkey, new account); Edit on P2 | Continue → 03; back → 02 | api → `profiles` (display_name, city, country_code, avatar_color) |
| P2 Profile | Third tab: profile card + Edit, the "Your dollars" card ([ADR 0006](decisions/0006-balance-top-up-cash-out.md)), trip summary, "Signed in with Passkey", notifications, past trips, help, Sign out | Profile tab on 03 / S5 | Edit → P1; Top up → B1; Cash out → B2; Sign out → 01; Trips tab → 03; Card tab → 12 | api → `profiles`, `push_subs`; Envio (trip count, total refunded); the account's AUSD balance; Mera session (sign out ends it) |
| B1 Top up | Simulated on-ramp: pay in your own currency, get dollars. On testnet: test dollars from the faucet. Teko "fill" | P2; 08 and 06 when short ("Top up to …") | Add … test dollars → back; close → back | Agora AUSD faucet (testnet) |
| B2 Cash out | Simulated off-ramp: dollars out to a bank in your own currency. Teko "wink" | P2 | Cash out $X → P2; close → P2 | AUSD transfer to a demo "bank" address (testnet) |
| A1 Activity | History across trips and your balance: "Needs you" (requests waiting for your approval) first, then top-ups, cash-outs, deposits, payments, receipts, settle-ups and refunds, grouped by day ([ADR 0007](decisions/0007-activity-screen.md)) | 03 (bell) | Needs you → 10; row → 07 / 11 / R2 / S2 / 13 / I1; back → 03 | Envio `Activity` + `BalanceActivity`; api (names, titles) |

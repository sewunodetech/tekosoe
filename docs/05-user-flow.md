# Tekosoe — User Flow

The app has two main flows. First, signing in and joining a trip (including the first deposit and picking a safety net). Second, spending from the pot until the end date, when settle-up runs by itself. The screen list at the end was the basis for the wireframes.

## Flow 1 — Sign in and join a trip

There are two ways in, and both go through the same passkey screen: opening the app directly, or opening an invite link from a friend. A new account fills in its profile (name, city, country, avatar colour) on screen P1 right after the passkey is created, then lands on Home or continues to the join screen.

People who arrive through a link skip Home. After the passkey they see the join confirmation straight away, pick a safety net and put in their first deposit, all on one screen. It's the fastest path and the most important one for the demo.

## Flow 2 — Inside a trip

The trip screen is the heart of the app. Anyone can spend from the pot while it has enough money. Every payment is recorded in the contract immediately, and payments above the trip's limit wait for one other member's approval.

On the end date, nobody has to press a button. The scheduler runs settle-up, overpayments are refunded, shortfalls are collected up to each safety net, and anything left becomes a bill. If the pot runs dry before the end date, payments are declined and the app nudges members to add money.

## Screen list for the wireframes

13 screens in total. Wireframes were done in priority order: the P0 screens in the demo first, the simulated card (P2) last.

| No | Screen | Main content | Main action | FR |
| --- | --- | --- | --- | --- |
| 1 | Welcome | Logo and one line on what the product does | Get started | FR-01 |
| 2 | Sign in with a passkey | A short note that there's no password | Continue with passkey; I already have an account | FR-01, FR-02 |
| 3 | Home | List of trips: pot, my balance, days left | Open a trip; Create a trip | FR-13 |
| 4 | New trip | Name, end date, approval limit, invite link | Create; Share link | FR-04, FR-05 |
| 5 | Invite link | Trip name, who invited you, members, end date | Join with passkey | FR-05 |
| 6 | Join and put in | Safety net, first deposit | Join and put in | FR-05, FR-06 |
| 7 | Trip | Pot, my net balance, feed, settle-up preview, countdown | Add money, Pay from pot, Card | FR-13, FR-14, FR-15 |
| 8 | Add money | Amount in dollars | Put in | FR-06 |
| 9 | Pay from pot | Recipient (member or address), amount, note, receipt photo, who it's for (everyone by default), even or manual split | Pay from pot | FR-07, FR-08, FR-17 |
| 10 | Waiting for approval | Details of the payment above the limit | Approve; Decline | FR-09 |
| 11 | Payment details | Who it was for, time left to dispute | Reject my share | FR-10 |
| 12 | Card (simulated) | Virtual Tekosoe card labelled as simulated, list of demo shops | Pay at shop | FR-16 |
| 13 | Settle-up result | Each member's put in, spent and net; refunds and charges already made | Pay bill (if any) | FR-11, FR-12 |

**Payment status on every screen:** show "Processing", then "Done", within seconds. Never the words hash, gas or blockchain.

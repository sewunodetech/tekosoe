# 0007 — An Activity screen (replacing Notifications), with Top up / Cash out in Envio

- Status: accepted (2 Oct 2026)
- Date: 2026-10-02

## Context

The bell on 03 Home opened a "Notifications" screen that was always empty: notifications only existed as a brief in-app banner and OS push (FR-18), and were never stored. Users wanted that page to hold their history: top-ups, deposits into the pot, payments, settle-ups and so on. Trip events were already in Envio (`Activity`), but Top up / Cash out ([ADR 0006](0006-balance-top-up-cash-out.md)) are plain AUSD transfers that weren't indexed. A testnet top-up is also "noisy" on-chain: the faucet always sends 10,000 and the app returns the excess, which used to go to the same "bank" address as Cash out (and the demo shop), so the two couldn't be told apart.

## Decision

- The `/notifications` route becomes **`/activity`**, titled **"Activity"**, still opened from the Home bell. Contents: a **"Needs you"** section (friends' payment requests waiting for your approval → 10 Approval), then history grouped by day. The dot on the bell only shows when something needs you.
- The data comes **only from Envio** (money is on-chain, rule 1): GroupVault events from `Activity`, plus a new **`BalanceActivity`** entity (TopUp / CashOut) built from AUSD `Transfer` events with a `where` filter (from = faucet, to = faucet, to = Cash out bank). Labels (names, titles) still come from the api.
- The app returns the faucet's excess **to the faucet**, not to the "bank", so that: faucet → user = Top up, user → faucet = reduces the latest Top up, user → bank = Cash out. Transfers from GroupVault → the demo shop (payments from a pot) are ignored.
- Older history (excess returned to the "bank"): a user → bank transfer within 5 minutes of a Top up that hasn't been reduced yet counts as the excess being returned.

## Consequences

- The indexer needs `envio codegen` + a redeploy (re-sync from `start_block`). Until then the app keeps working; Top up / Cash out rows are simply skipped.
- Old edge case: a Top up of exactly $10,000 followed by a real Cash out within 5 minutes would be read as returning the excess.
- The screen sits outside the Final UI; its design reuses the F07 activity-row pattern (white cards, icon tiles / avatars). If push notifications are ever stored, they'll show here too.

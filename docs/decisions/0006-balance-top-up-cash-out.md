# 0006 — A personal "Your dollars" balance with Top up and Cash out

- Status: accepted (1 Oct 2026)
- Date: 2026-10-01

## Context

Tekosue is pitched as cross-border payments with an on-ramp and off-ramp (BRD: fiat on/off-ramp on the roadmap). The app has two layers of money: the **personal dollar balance** (AUSD in the user's account) and the **trip pot** (GroupVault). Until now the personal balance only appeared in passing ("From your balance of …"). On testnet it was filled with an "Add demo funds" button, which was confusing next to "Add money" for the pot, and later replaced by automatic top-ups. Automatic top-ups hid the balance layer, yet that layer is exactly what carries the on/off-ramp story. The Final UI design had no screen for it.

## Decision

- A **"Your dollars"** card on **Profile** (below the profile card): the personal AUSD balance, with a **Top up** button (teal) and a **Cash out** button (outline). Colours follow the app's tokens (white card, butter + coin decoration). The name "Your dollars" avoids a clash with "Your balance" on the trip card (the balance inside a trip).
- **Top up** (`/balance/top-up`, modal) simulates the on-ramp. On testnet: Agora's AUSD faucet, 10,000 test dollars per request. The screen explains the real flow (pay in your own currency → it becomes dollars → put it into a trip).
- **Cash out** (`/balance/cash-out`, modal) simulates the off-ramp. On testnet: real AUSD is transferred from the user's account to a demo "bank" address (`EXPO_PUBLIC_CASH_OUT_ADDRESS`, defaulting to the demo shop's address). No real bank transfer happens, and the screen says so.
- **No free dollars appear automatically**, neither at onboarding nor mid-payment. When a user is short, the main Add money / Join button becomes "Top up to …" and opens Top up.

## Consequences

- These screens sit outside the Final UI and need an official design if the canvas is updated. [`06-screen-map.md`](../06-screen-map.md) already lists B1/B2.
- New users have to top up once before they can deposit. The faucet has a global cooldown of about a minute; a friendly message shows when it's busy.
- On mainnet, Top up / Cash out are replaced by an on/off-ramp partner (for example Mercuryo); the UI and flow stay the same.
- The AUSD ABI in `@tekosue/shared` gains `transfer`.

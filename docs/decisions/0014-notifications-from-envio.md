# 0014 — Notifications from Envio; Alchemy out of scope

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

Push notifications (FR-18) were designed around Alchemy webhooks (P3). Alchemy was already marked "dropped from scope" in `docs/STATUS.md`: Gas Manager compatibility with Mera accounts was never verified, webhook support for Monad testnet was uncertain, and network fees are already covered by our own MON drip. Even so, the landing page still listed Alchemy under "Built with" ("Covers the network fees"), which broke the rule that sponsor integrations must be real on testnet.

The ADR 0013 rule (unpaid debt blocks new trips) needs reminders, and payment approvals need to reach the other members. The api already had push code (Expo Push, `push_subs`, an event → message mapping), but only an Alchemy webhook triggered it.

## Decision

- **Alchemy is removed** from the landing page and the sponsor assets. The `/api/webhooks/alchemy` route stays as an optional source (`NOTIFY_SOURCE=alchemy`) and is off by default.
- **The event source is Envio** (`NOTIFY_SOURCE=envio`, the default). The api job `startEnvioNotifier` (every `NOTIFY_INTERVAL_MS`, default 15 seconds) reads new `Activity` rows with a cursor in `kv_state` (`notify:envio:cursor`). On its first run the cursor is set to "now", so history is never sent as pushes. Events are deduped through `processed_events` (txHash, logIndex).
- The webhook and the poller both call `handleGroupEvent`: record `DebtPaid` on the invoice, create invoices on `Settled` (also when a member, not our scheduler, settled), then send push when `FEATURE_PUSH=true`. The poller runs even without push, so invoice status stays up to date.
- **Push notifications** (English like the app, no crypto terms, each opens an app route under `/trip/...`):
  - `SpendRequested` → other members: "Jack wants to pay $150.00 from the pot. Tap to approve." (`/trip/{id}/spend/{spendId}/approve`)
  - `SpendExecuted` → the other participants, with their share; `SpendRejected` and `ShareDisputed` → the payer.
  - `Settled` → every member; `Pulled` → whoever was short ("You still owe $X" when something is left); `Refunded` → whoever got money back.
  - **Debt reminder** (ADR 0013): "You still owe $X from {trip}", at most once per `DEBT_REMINDER_HOURS` (default 24) per trip and member, starting a day after the debt is first seen (the settle-up push already told them that day).
- The trip name comes from the api metadata (the creator's name for it), falling back to the on-chain name.

## Consequences

- `FEATURE_PUSH=true` no longer needs `ALCHEMY_WEBHOOK_SIGNING_KEY`; that key is only required with `NOTIFY_SOURCE=alchemy`.
- Push needs a native build (APK or dev build). Expo Go on Android doesn't support push since SDK 53.
- Push latency ≈ the poll interval plus indexer lag (a few seconds up to ~20 seconds), enough for approvals and reminders.
- Fewer sponsors under "Built with", but every one listed really runs on testnet.

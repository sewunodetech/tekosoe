# 0013 — Unpaid debt blocks new trips

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

In GroupVault v1 (ADR 0005), a shortfall that the safety net doesn't cover at settle-up becomes `debt`. It can be paid at any time with `payDebt`, but with no deadline and no consequence: a member who never pays can still start and join other trips, while members holding `credit` wait without any certainty.

Freezing balances (AUSD's freeze feature) is not an option: that power belongs to Agora as the issuer, for legal compliance; our contract has no such permission, and using it would break the "no custody" rule. The contract is in fact designed so that an account frozen by Agora can't block a settle-up.

## Decision

- `GroupVault` keeps `outstandingDebt[address]` = the member's total `debt` across every trip in this vault. It grows in `_pullDebtors` (whatever couldn't be pulled) and shrinks in `payDebt` / `payDebtWithPermit`.
- `createGroup`, `joinGroup` and `joinGroupWithPermit` revert with `OutstandingDebt()` while `outstandingDebt[msg.sender] > 0`.
- Trips the member already belongs to are **not** affected: deposits, payments, approvals, disputes and settle-up keep working. Only new trips are blocked.
- New view `outstandingDebtOf(address)`. No new event: Envio already has `Member.debt` per trip.
- The app blocks "Create trip" and "Join" up front (Envio: `Member` with `debt > 0`), shows "You still owe $X" with a Pay button to that trip's invoice on Home, New trip, the invite screen and the settle-up screen, and maps the contract error to the same message in `tx/errors.ts`.
- New invariant (tested, including the fuzz test): `outstandingDebtOf(m) == Σ debt[g][m]`.

## Consequences

- **A new contract had to be deployed** (v1 can't be upgraded): `0x02Fb964B6b4470C14D61738EC0a296fa9F2dbCE0`, block 68690383. Trips on the old contract stay on-chain but aren't shown by the app; they were testnet test data, and the matching off-chain data was cleared (backup kept by the team).
- Addresses were updated in `packages/shared/src/chain.ts`, `packages/indexer/config.yaml`, the api/indexer/mobile env and the EAS env, and Envio was resynced (together with the ADR 0012 schema change).
- Debt adds up across trips: paying one trip isn't enough while another still has debt.
- Debt still has no deadline; only its consequence changed. Members who owe get a daily reminder (ADR 0014).

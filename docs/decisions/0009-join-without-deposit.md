# 0009 — Join with one tap: no deposit, the trip creator's safety net

- Status: accepted (4 Oct 2026)
- Date: 2026-10-04

## Context

06 Join + put in made every invitee choose a first deposit ($50–$200) and their own safety net before joining, and needed enough dollars (or a Top up) first. Friends opening an invite link just want to be in the trip; asking for money and a "spending permission" up front made joining feel like a payment. The team also expected the safety net to be the organizer's setting, like the approval limit.

The contract already allows this: `joinGroup(groupId, inviteSig, pullCap, initialDeposit)` accepts a deposit of 0, and `pullCap` is per member. A safety net cannot be granted by someone else: it is permission to pull the member's own dollars at settle-up (AUSD allowance), so the member has to sign it. That's the no-custody rule.

## Decision

- **05 Invite → "Join with Passkey" joins right away**: one transaction, no deposit, then back to 03 Home. Signed-out invitees go through 02 Sign in (and P1 for a new account) and the join continues on its own (`/invite/<code>?join=1`). Members see "Open trip" instead.
- **The trip creator picks the safety net** on 04 New trip ($25 / $50 / $100, default $50). It is the creator's own `pullCap` in `createGroup`, so it lives on-chain; there's no new contract field and no database column.
- **Invitees join with that same safety net.** 05 Invite reads it from the contract (`positionOf(groupId, creator)`) and shows one line of consent; tapping Join is the agreement. The allowance is a permit signed on the phone (no extra Face ID) for current allowance + safety net, so permission already given for other trips is kept.
- 06 Join + put in is retired; `/invite/<code>/join` redirects to 05. Money goes in later through 08 Add money.

## Consequences

- A member who never adds money and overspends is covered by the safety net first; anything beyond it is on their invoice (I2 Due), as before.
- The creator could set a safety net of 0 by an older build; then invitees join with `joinGroup` and no permit.
- No contract change or redeploy. The canvas 06 screen no longer matches the app.

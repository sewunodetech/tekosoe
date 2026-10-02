# 0005 — GroupVault v1: signed invites, a settle-up that can't get stuck, AUSD permit

- Status: accepted (implemented with Foundry tests; deployed, see [STATUS](../STATUS.md))
- Date: 2026-09-30

## Context

The spec draft ([`03-technical-spec.md`](../03-technical-spec.md)) had gaps that only showed up while writing the contract and inspecting testnet AUSD on-chain (`0xa9012a05…22dC`: 6 decimals, EIP-2612 `permit`, EIP-3009, `isAccountFrozen`, upgradeable proxy):

1. `joinGroup(groupId, inviteSecret, pullCap)` exposes the invite secret in calldata. Once one person joins, anyone can reuse that secret, or front-run their transaction.
2. `settle` pulls and pays in a single loop. One frozen AUSD account, or one short balance or allowance, makes the whole settle-up revert and leaves the trip stuck forever.
3. An AUSD `approve` applies per vault, not per trip, and the app has to send two transactions (approve + join).
4. Events carry too little for the indexer: `GroupCreated` lacks `disputeWindow`, `SpendRequested` lacks `participants/shares/noteHash`. There are no views for `debt`, `credit` or `pullCap`.

## Decision

- **Invites:** `Group.inviteKey` (an address) replaces `inviteHash`. The invite link carries the invite's private key; the joiner submits an EIP-191 signature by that key over `inviteDigest(groupId, joiner) = keccak256(abi.encode(vault, chainId, groupId, joiner))`. The signature is bound to the joiner, so it can't be reused or front-run.
- **createGroup** takes the creator's `pullCap` (the creator is a member too).
- **joinGroup(groupId, inviteSig, pullCap, initialDeposit)** makes the first deposit at the same time; **joinGroupWithPermit / depositWithPermit** use the AUSD permit so a single transaction is enough. The permit call is wrapped in `try` (safe against front-running).
- **Settle-up never reverts because of one member:** each pull = min(shortfall, `pullCap`, balance, allowance) via `trySafeTransferFrom`; on failure it becomes `debt`. Payouts go through `trySafeTransfer`; on failure the funds stay in the pot as `credit`, claimable with **claimCredit**. Pro-rata splits give the remainder to the last positive member so no dust is left behind.
- **payDebt** forwards AUSD straight to members holding `credit` (in member order).
- Invariants: before settle-up `sum(deposited − used) == pool`; after settle-up `sum(credit) == sum(debt) + pool`, and the vault's AUSD balance == the sum of every trip's pool.
- Events: `GroupCreated` + `disputeWindow`; `SpendRequested` + `participants, shares, noteHash`. New views: `positionOf`, `spendParticipants`, `spendCount`, `inviteDigest`. `getSpend` reverts with `SpendNotFound` for unknown ids.
- The ABI in `@tekosoe/shared` is now generated from `forge build` (`npm run abi -w @tekosoe/contracts`).
- `foundry.toml`: `evm_version = "prague"` (required for Monad).

## Consequences

- `group_meta.invite_code_hash` is removed from the api (migration `0002`); trip details are tied to the on-chain creator instead.
- Mobile: the invite link holds `groupId` + the invite key; the app signs `inviteDigest` with that key (viem `privateKeyToAccount(secret).signMessage({ message: { raw: digest } })`), not with the Mera key.
- The allowance is still one per vault: a member in several trips shares one approval across them. Pulls are limited by what's left of the allowance, and any shortfall becomes `debt`, shown clearly.

# 0001 — Monorepo and stack

- Status: accepted
- Date: 2026-09-28

## Context

The technical spec calls for one TypeScript monorepo holding the mobile app, a small website, a mini backend, the contract and the indexer, with ABIs shared between them.

## Decision

- npm workspaces + Turborepo (pnpm at first, switched to npm at the team's request). Packages are named `@tekosoe/*`; internal packages are referenced with version `"*"`.
- `apps/mobile`: Expo SDK 57 + Expo Router (from the default `create-expo-app` template). NativeWind to be added once UI work starts.
- `apps/web`: Next.js 16 (App Router, Tailwind v4), deployed statically to Vercel.
- `apps/api`: Hono + `@hono/node-server`, running in Docker. Kept separate from Next.js so the settle-up scheduler runs continuously and on time. _(Superseded by [ADR 0004](0004-api-express.md): Express.)_
- `packages/contracts`: Foundry + OpenZeppelin (installed from npm, wired up through `remappings.txt`).
- `packages/indexer`: Envio HyperIndex v3 (`indexer.onEvent`).
- `packages/shared`: ABIs, chain, addresses, types, zod schemas.
- A native app (Expo), not a PWA, as already decided in the BRD.

## Consequences

- Every change to a contract event or function must be followed by an ABI update in `packages/shared` and `packages/indexer/config.yaml`.
- Native mobile packages are installed with `npx expo install` so their versions match the SDK.

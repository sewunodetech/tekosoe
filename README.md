# Tekosoe

One pot for the whole trip. A shared wallet that settles up by itself: friends in different countries put AUSD into one pot, spend from it with Face ID, and on the trip's end date the `GroupVault` contract on Monad testnet works out and settles who owes whom.

Built for Monad Metropolis (Consumer Products & Payments · Agora · Mera · Envio · Alchemy).

> Status: boilerplate. See [`docs/STATUS.md`](docs/STATUS.md).

## Structure

```
apps/mobile         Expo (React Native) + Expo Router
apps/web            Next.js — invoice verification, invite links, passkey domain files
apps/api            Hono — settle scheduler, gas drip, metadata API, push
packages/contracts  Foundry — GroupVault
packages/indexer    Envio HyperIndex
packages/shared     ABI, chain, money, metadata schemas
database/           Postgres migrations (metadata only)
docs/               BRD, PRD, technical spec, user stories, flows, screen map, dev plan
```

## Getting started

Requirements: Node 22+, pnpm (`corepack enable`), [Foundry](https://getfoundry.sh), Docker (for the Envio indexer).

```bash
pnpm install
cp .env.example apps/mobile/.env   # fill in the values, then do the same for apps/api
pnpm --filter @tekosoe/mobile start
pnpm --filter @tekosoe/contracts test
```

## Deployments (Monad testnet, chain 10143)

| Contract | Address |
| --- | --- |
| GroupVault | TBD |
| AUSD | TBD (verify against Agora docs) |

## For AI agents

Start at [`AGENTS.md`](AGENTS.md).

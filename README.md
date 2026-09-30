# Tekosoe

One pot for the whole trip. A shared wallet that settles up by itself: friends in different countries put AUSD into one pot, spend from it with Face ID, and on the trip's end date the `GroupVault` contract on Monad testnet works out and settles who owes whom.

Built for Monad Metropolis (Consumer Products & Payments · Agora · Mera · Envio · Alchemy).

> Status: boilerplate. See [`docs/STATUS.md`](docs/STATUS.md).

## Structure

```
apps/mobile         Expo (React Native) + Expo Router
apps/web            Next.js — invoice verification, invite links, passkey domain files
apps/api            Express — settle scheduler, gas drip, metadata API, push
packages/contracts  Foundry — GroupVault
packages/indexer    Envio HyperIndex
packages/shared     ABI, chain, money, metadata schemas
docs/               BRD, PRD, technical spec, user stories, flows, screen map, dev plan
```

## Getting started

Requirements: Node 22+ (npm), [Foundry](https://getfoundry.sh), Docker (for the Envio indexer).

```bash
npm install
cp .env.example apps/mobile/.env           # fill in the values
cp apps/api/.env.example apps/api/.env      # backend secrets (RELAXED_ENV=true to boot locally without all of them)
npm run start -w @tekosoe/mobile
npm test -w @tekosoe/contracts
```

### Everything except mobile in Docker

`docker-compose.yml` runs Postgres + Hasura + the Envio indexer, the api, and the web app. Secrets stay in each package's gitignored `.env`: `apps/api/.env` is required, and `packages/indexer/.env` (`ENVIO_API_TOKEN` for HyperSync) is optional.

```bash
npm run docker:up     # build + start in the background
npm run docker:ps     # status
npm run docker:logs   # follow logs
npm run docker:down   # stop (add -v via `docker compose down -v` to wipe the indexer DB)
```

| Service | URL |
| --- | --- |
| api | http://localhost:3001/health |
| Hasura / Envio GraphQL | http://localhost:8080 (console, admin secret `testing`) · `/v1/graphql` |
| indexer | http://localhost:9898/healthz |
| web | http://localhost:3000 |
| Postgres (indexer) | localhost:5433 |

Ports clash with `envio dev`, so stop that stack first (`envio stop`). Host ports and the Hasura secret can be overridden in a root `.env` (`API_HOST_PORT`, `HASURA_HOST_PORT`, `WEB_HOST_PORT`, `ENVIO_PG_HOST_PORT`, `HASURA_ADMIN_SECRET`, `ENVIO_PG_PASSWORD`). Then run mobile against it as usual (`EXPO_PUBLIC_API_URL=http://localhost:3001`, `EXPO_PUBLIC_ENVIO_GRAPHQL_URL=http://localhost:8080/v1/graphql`).

## Deployments (Monad testnet, chain 10143)

| Contract | Address |
| --- | --- |
| GroupVault | TBD |
| AUSD | TBD (verify against Agora docs) |

## For AI agents

Start at [`AGENTS.md`](AGENTS.md).

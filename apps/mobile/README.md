# Tekosue — mobile app (`apps/mobile`)

The Tekosue app: Expo (React Native, SDK 57) with Expo Router. Every user interaction happens here — passkey sign-in (Mera), trips, deposits, payments and approvals, settle-up, invoices, encrypted receipts and invites.

## Run it

```bash
npm install                          # once, at the repo root
npm run start -w @tekosue/mobile     # Expo dev server
npm test -w @tekosue/mobile          # pure-logic tests (invoice links)
```

- **Demo mode** (default): `EXPO_PUBLIC_DATA_SOURCE=demo` — the Rina / Wei / Jack trip to Japan, no network needed.
- **Live mode**: `EXPO_PUBLIC_DATA_SOURCE=live` plus the api and Envio URLs — reads and writes on Monad testnet. Copy [`.env.example`](.env.example) to `.env`.
- **Signer**: `EXPO_PUBLIC_SIGNER=mera` (passkey, needs a dev build or the APK) or `demo` (an on-device random key, for the web and Expo Go).
- **Domain**: passkeys and invite links use `www.tekosue.xyz` (`EXPO_PUBLIC_PASSKEY_DOMAIN`, `EXPO_PUBLIC_WEB_DOMAIN`).

Push notifications need a native build: Expo Go on Android doesn't support them.

## Build the APK

```bash
cd apps/mobile
npx eas-cli build --profile preview --platform android
```

The `preview` profile reads its `EXPO_PUBLIC_*` values from the EAS "preview" environment. After a build, check the domain files with `npm run check:wellknown -- www.tekosue.xyz` from the repo root.

## Where things are

`src/app` (routes / screens) · `src/data` (demo + live data layer) · `src/features` (hooks) · `src/tx` (transaction flow and friendly errors) · `src/wallet` (Mera and demo signers) · `src/lib` (chain, Envio, api, invites, receipt crypto). Roadmap: [`ROADMAP.md`](ROADMAP.md). Rules: [`AGENTS.md`](AGENTS.md).

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Tekosoe — aturan app

Lihat juga `AGENTS.md` di root. App ini memegang **semua interaksi user**; transaksi ditandatangani di perangkat lewat Mera lalu dikirim langsung ke Monad.

- **Layar**: ikuti `docs/06-peta-layar.md` persis — nama layar dan label tombol dalam bahasa Inggris seperti di desain (01 Welcome … 13 Settled, R1–R3, I1–I3, S1–S6). Jalur demo utama: 01 → 02 → 03 → 07 → 09 → S2 → 10 → S1 → 13 → I1. Maskot "Teko" punya ekspresi per layar (fill, worry, think, sleep, sad, cheer, love).
- **Tanpa istilah kripto** di teks yang terlihat user: tidak ada "wallet", "gas", "seed phrase", "blockchain", "token", "hash", "transaction". Status transaksi: "Processing" → "Done". Istilah yang dipakai: pot, trip, safety net, receipt, invoice.
- **Uang**: `bigint` AUSD 6 desimal; tampilkan hanya lewat `formatDollars` dari `@tekosoe/shared`.
- **Sumber data**: saldo/feed/status dari Envio (TanStack Query + `graphql-request`, polling beberapa detik); label (nama, judul, struk) dari `apps/api` — **jangan pernah** terhubung ke database langsung. Gabungkan lewat `groupId`/`spendId`. Kalau api mati: nama → alamat singkat, judul → "Payment".
- **Mera** (`@category-labs/mera`) adalah satu-satunya account layer. Belum terpasang — spike hari pertama: passkey + PRF di iOS/Android; cadangan: langkah Mera di in-app browser dengan domain yang sama (`apps/web` melayani `apple-app-site-association` dan `assetlinks.json`). Verifikasi setiap fungsi Mera dari source di `node_modules`.
- **Spend**: hitung `noteHash` dengan `computeNoteHash` sebelum memanggil `spend`; kirim metadata ke api setelahnya. `joinGroup` + `approve` AUSD sebesar `pullCap` dalam satu signing session (satu konfirmasi Face ID). `pullCap` ditulis di UI sebagai "safety net".
- **Struk**: kompres → enkripsi AES-GCM kunci grup di HP → `receiptHash = keccak256(ciphertext)` → unggah lewat api → `attachReceipt`. Paket rencana: expo-camera, expo-image-picker, expo-document-picker, expo-print, react-native-quick-crypto, expo-notifications, NativeWind (pasang dengan `npx expo install` saat dibutuhkan).
- Template bawaan Expo (`src/app/index.tsx`, `explore.tsx`, komponen contoh) masih ada; ganti saat membangun layar 01–03.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

> **Mulai dari [`ROADMAP.md`](ROADMAP.md)** — goal, scope, arsitektur target (`src/data`, `src/features`, `src/wallet`, `src/tx`), dan paket kerja M0–M11. Ambil WP berikutnya yang dependensinya sudah ✅ di `docs/STATUS.md` › Mobile.

## Tekosoe — aturan app

Lihat juga `AGENTS.md` di root. App ini memegang **semua interaksi user**; transaksi ditandatangani di perangkat lewat Mera lalu dikirim langsung ke Monad.

- **Layar**: ikuti `docs/06-peta-layar.md` persis — nama layar dan label tombol dalam bahasa Inggris seperti di desain (01 Welcome … 13 Settled, R1–R3, I1–I3, S1–S6). Jalur demo utama: 01 → 02 → 03 → 07 → 09 → S2 → 10 → S1 → 13 → I1. Maskot "Teko" punya ekspresi per layar (fill, worry, think, sleep, sad, cheer, love).
- **Tanpa istilah kripto** di teks yang terlihat user: tidak ada "wallet", "gas", "seed phrase", "blockchain", "token", "hash", "transaction". Status transaksi: "Processing" → "Done". Istilah yang dipakai: pot, trip, safety net, receipt, invoice.
- **Uang**: `bigint` AUSD 6 desimal; tampilkan hanya lewat `formatDollars` dari `@tekosoe/shared`.
- **Sumber data**: saldo/feed/status dari Envio (TanStack Query + `graphql-request`, polling beberapa detik); label (nama, judul, struk) dari `apps/api` — **jangan pernah** terhubung ke database langsung. Gabungkan lewat `groupId`/`spendId`. Kalau api mati: nama → alamat singkat, judul → "Payment".
- **Mera** (`@category-labs/mera`) adalah satu-satunya account layer. Belum terpasang — spike hari pertama: passkey + PRF di iOS/Android; cadangan: langkah Mera di in-app browser dengan domain yang sama (`apps/web` melayani `apple-app-site-association` dan `assetlinks.json`). Verifikasi setiap fungsi Mera dari source di `node_modules`.
- **Spend**: hitung `noteHash` dengan `computeNoteHash` sebelum memanggil `spend`; kirim metadata ke api setelahnya. `joinGroup` + `approve` AUSD sebesar `pullCap` dalam satu signing session (satu konfirmasi Face ID). `pullCap` ditulis di UI sebagai "safety net".
- **Struk**: kompres → enkripsi AES-GCM kunci grup di HP → `receiptHash = keccak256(ciphertext)` → unggah lewat api → `attachReceipt`. Paket rencana: expo-camera, expo-image-picker, expo-document-picker, expo-print, react-native-quick-crypto, expo-notifications, NativeWind (pasang dengan `npx expo install` saat dibutuhkan).
- Styling saat ini `StyleSheet` biasa. NativeWind (disebut di spesifikasi) belum dipasang — putuskan dulu sebelum banyak layar dibangun, jangan dicampur.

## Desain

Sumber: canvas Claude "Tekosoe — Wireframe", halaman **Final UI** (F01–F13, S01–S12, Teko). Halaman Wireframe, UI, UI v2 hanya eksplorasi — jangan dipakai.

- **Token di `src/constants/theme.ts`**: `colors` (semantik — pakai ini), `palette` (warna mentah), `fonts`, `type` (skala tipografi), `radius`, `screenPadding`. **Jangan tulis hex atau `fontWeight` langsung di layar** — `fontWeight` tidak jalan dengan font kustom di Android; pakai `fonts.*`.
- Ringkas: latar ivory `#faf8f3`, teks ink `#1d2426`, primary teal `#1f7a6e`, kartu hero mint `#dcf0ea`, aksen oranye `#ff9a62`, positif hijau `#1c7a4f`. Judul/angka **Bricolage Grotesque**, teks **Manrope** (dimuat di `app/_layout.tsx`). Hanya mode terang.
- **Komponen dasar di `src/components/ui/`**: `Text` (prop `variant` dari `type`), `Button` (`primary` 56 / `outline` 52 / `ghost` 44 / `dashed` / `pill`), `ScreenHeader` (tombol bulat 44px, `back` atau `close` untuk modal, slot `right`), `Icon` (semua ikon garis dari desain), `Avatar` (inisial + `tint`), `ChoiceChips` (pilihan nominal), `TextField`, dan di `layout.tsx`: `Screen` (area aman + scroll + `footer` di bawah), `Surface`, `Pill`, `KeyValue`, `InfoBox`, `SectionLabel`, `AvatarStack`.
- **Komponen Tekosoe di `src/components/`**: `teko.tsx` (maskot), `logo.tsx` (wordmark "tekosoe" + titik oranye), `decor.tsx` (`Sparkle`, `Coin`, `Bob`, `Pop`, `PulseDot`, `Confetti`), `trip-rows.tsx` (`ActivityRow`, `MemberAmountRow`, `PersonRow`), `receipt-paper.tsx`, `invoice/qr-code.tsx`.
- **Teko** di-port dari `Teko.dc.html` ke `react-native-svg` dengan 10 ekspresi: `idle`, `cheer`, `pour`, `fill`, `wink`, `love`, `think`, `worry`, `sad`, `sleep`. Animasi SMIL asli tidak jalan di RN, jadi tiap pose adalah frame diam + naik-turun/goyang via Reanimated (mati otomatis saat "reduce motion"). Pemakaian per layar mengikuti desain (01 pour, 02 wink, 05 love, 08 fill, 09 worry, 10/S2 think, S1 sleep, S3/S4 sad, 13 cheer).
- Semua layar Final UI sudah diimplementasikan dengan **data demo** dari `src/lib/demo.ts` (cerita Rina/Wei/Jack di Jepang). Saat menyambungkan data asli, ganti sumber datanya, bukan tampilannya.
- **Jebakan yang sudah ketemu**: (1) `<Link asChild>` tidak menerima array style — pakai `StyleSheet.flatten`. (2) Layout animation Reanimated (`ZoomIn.springify()` dll.) bisa macet di web — pakai `Pop`/shared value biasa. (3) Jangan menaruh `<Link>` di dalam `<Link>` (anchor bersarang di web) — pakai `router.push`.

## Peta route (Expo Router, `src/app/`)

| Layar | File | Catatan |
| --- | --- | --- |
| 01 Welcome | `index.tsx` | F01Welcome |
| 02 Sign in | `sign-in.tsx` | F02SignIn; Face ID masih langsung ke Home (TODO Mera) |
| 03 Home · S5 | `(tabs)/index.tsx` | F03Home + kartu grup besar S05BigGroup |
| 12 Card | `(tabs)/card.tsx` | F12Card; Tokyo Taxi → S4 |
| 04 New trip | `trip/new.tsx` | F04Create |
| 05 Invite | `invite/[code]/index.tsx` | F05Invite; deep link `tekosoe://invite/<code>` |
| 06 Join + put in | `invite/[code]/join.tsx` | F06Join |
| 07 Trip · S1 | `trip/[id]/index.tsx` | F07Group; `?state=empty` = S01PotEmpty |
| 08 Add money | `trip/[id]/add-money.tsx` | F08AddMoney (modal) |
| 09 Pay from pot | `trip/[id]/pay.tsx` | F09Pay (modal) |
| R1 Add receipt | `trip/[id]/add-receipt.tsx` | S07ReceiptCapture (modal) |
| S4 Offline | `trip/[id]/payment-failed.tsx` | S04Offline |
| S6 Trip members | `trip/[id]/members.tsx` | S06Members (demo: `/trip/euro/members`) |
| 13 Settled | `trip/[id]/settled.tsx` | F13Settled |
| I1–I3 Invoice | `trip/[id]/invoice.tsx` | S10/S11/S12; `?who=jack` (Refunded), `wei` (Due), `rina` (Paid) |
| 11 Payment details | `trip/[id]/spend/[spendId]/index.tsx` | F11Detail |
| 10 Approval | `trip/[id]/spend/[spendId]/approve.tsx` | F10Approve (modal, "Rina's phone") |
| S2 Waiting | `trip/[id]/spend/[spendId]/waiting.tsx` | S02Waiting |
| S3 Declined | `trip/[id]/spend/[spendId]/declined.tsx` | S03Declined (modal) |
| R2–R3 Receipt | `trip/[id]/spend/[spendId]/receipt.tsx` | S08ReceiptLocked → S09ReceiptView |

ID demo: trip `japan`, `euro`; spend `dinner`, `ramen`, `train`. Jalur demo juri: `/` → Sign in → Home → Japan Trip → Pay → Request approval → "Demo: open this on Rina's phone" → Approve → (pot kosong) → Preview settle-up → See your invoice.

## Struktur `src/`

- `app/` — route saja (lihat tabel). Kode non-route di luar folder ini.
- `components/` — `ui/` (komponen dasar desain) + komponen Tekosoe (lihat bagian Desain). Komponen template Expo sudah dihapus.
- `lib/demo.ts` — data demo semua layar (`usd()`, `money()`, `signed()` memakai `@tekosoe/shared`).
- `constants/theme.ts` — token desain.
- `lib/` — `env.ts` (`EXPO_PUBLIC_*`), `envio.ts` (GraphQL client), `api.ts` (`apiFetch` ke apps/api), `chain.ts` (viem public client, baca saja).
- `providers/app-providers.tsx` — TanStack Query. Provider Mera/sesi nanti ditambahkan di sini.
- Env: salin `apps/mobile/.env.example` → `apps/mobile/.env`.

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

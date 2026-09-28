# Roadmap mobile app Tekosoe

Dokumen kerja untuk tim/agent mobile. Roadmap semua tim ada di [`docs/ROADMAP.md`](../../docs/ROADMAP.md); progres dicentang di [`docs/STATUS.md`](../../docs/STATUS.md) › Mobile.

**Deadline submit:** 12 Okt 2026 (deadline resmi 13 Okt 23.59 ET).

## Posisi sekarang

- ✅ Semua layar Final UI sudah jadi: 01–13, R1–R3, I1–I3, S1–S6, plus maskot Teko (10 ekspresi, animasi "pour") dan sistem desain (`src/constants/theme.ts`, `src/components/ui/*`).
- ⏳ Semua data masih **demo** (`src/lib/demo.ts`). Tombol aksi hanya berpindah layar, belum mengirim transaksi.
- ⏳ Mera belum dipasang, belum ada state loading/kosong/error, belum ada build di HP.
- ⏳ Backend yang dibutuhkan belum siap (dikerjakan tim lain): `GroupVault` masih skeleton, indexer baru `GroupCreated`, api baru `/health`.

Prinsip utama: **mobile tidak boleh macet menunggu backend.** Layar dipisahkan dari sumber data lewat dua mode, `demo` dan `live`, dan kebutuhan data ke tim lain ditulis eksplisit (bagian 4).

## 1. Goal

1. **Jalur demo juri jalan dengan data asli di HP** (iOS + Android), dengan transaksi nyata di Monad testnet:
   Welcome → Face ID → Home → Japan Trip → Pay $150 → Request approval → (HP Rina) Approve → pot kosong → Settled → Invoice.
2. **Mode demo tetap hidup.** App bisa jalan penuh tanpa backend, diatur satu env. Dipakai untuk video cadangan dan untuk bekerja paralel dengan tim lain.
3. **Terasa seperti app pembayaran biasa.** Face ID, nominal dolar, status "Processing → Done", tanpa istilah kripto, Teko bergerak sesuai desain.
4. **Bisa dipasang juri.** APK Android + TestFlight iOS lewat EAS.

**Definisi selesai mobile v0.1**

- Jalur demo di atas lolos di 3 HP (3 akun) dengan mode `live`.
- Semua layar punya state loading, kosong, dan error.
- `npm run typecheck && npm run lint && npm test` hijau.
- Tidak ada kata terlarang di UI ("wallet", "gas", "seed phrase", "blockchain", "token", "hash", "transaction").
- Build EAS terpasang di HP juri.

## 2. Scope

| Lapisan | Masuk | Keluar |
| --- | --- | --- |
| **P0** (wajib) | Lapisan data demo/live · sesi Mera + Face ID · semua aksi uang (create/join/deposit/spend/approve/reject/dispute/payDebt) · status transaksi & error · form lengkap (validasi nominal, tanggal, split custom) · struk (kamera/PDF → enkripsi → upload → `attachReceipt` → buka dengan Face ID) · invoice (PDF lewat expo-print, share) · deep link undangan · build EAS | Redesign layar (desain sudah final) · dark mode · multi-bahasa · pengaturan/profil lengkap |
| **P1** | Feed real-time (polling/subscription) · push notification (approval, invoice) | OCR struk |
| **P2** | Kartu simulasi bayar ke toko demo · kunci enkripsi turunan PRF | Kartu sungguhan · on/off-ramp fiat |

**Aturan potong:** kalau molor lebih dari 1 hari, potong P2, lalu P1. P0 tidak pernah dipotong.

## 3. Arsitektur yang harus diikuti

```
src/app/*            layar — UI sudah jadi. Jangan ubah tampilan; hanya ganti sumber data & handler.
src/features/<x>/    hook per domain (akan dibuat):
                       query:    useTrips, useTrip, useActivity, useSpend, useMembers, useInvoice
                       mutation: useCreateTrip, useJoinTrip, useDeposit, usePay, useApprove,
                                 useReject, useDispute, usePayDebt, useAttachReceipt
src/data/            port + dua adapter (akan dibuat):
  ├─ types.ts        tipe domain Trip, Member, Spend, Invoice — bentuknya sama dengan src/lib/demo.ts
  ├─ demo/           adapter demo (isi src/lib/demo.ts dipindah ke sini)
  └─ live/           adapter live: Envio (src/lib/envio.ts) + api (src/lib/api.ts) + kontrak (viem)
src/wallet/          Signer interface + MeraSigner (live) + DemoSigner (no-op)   (akan dibuat)
src/tx/              kirim transaksi, tunggu hasil, status Processing/Done, peta error → teks ramah  (akan dibuat)
src/crypto/          AES-GCM struk + keccak256 ciphertext (react-native-quick-crypto + viem)  (akan dibuat)
```

- **Pemilih mode:** `EXPO_PUBLIC_DATA_SOURCE=demo|live`, dibaca di `src/lib/env.ts`. Default `demo`.
- **Layar hanya memakai hook `src/features/*`**, tidak pernah memanggil Envio/api/kontrak langsung.
- **Uang:** `bigint` AUSD 6 desimal; tampilkan dengan `money()`/`signed()` (`src/lib/demo.ts`, nanti dipindah ke `src/data`) yang memakai `formatDollars` dari `@tekosoe/shared`.
- **`noteHash`** selalu dari `computeNoteHash` (`packages/shared/src/metadata.ts`). **ABI** dari `packages/shared/src/abi/groupVault.ts`.
- **Pakai ulang yang sudah ada:** `src/components/ui/*`, `src/components/teko.tsx`, `decor.tsx`, `trip-rows.tsx`, `receipt-paper.tsx`, `invoice/qr-code.tsx`, `src/constants/theme.ts`, `src/providers/app-providers.tsx` (React Query).

## 4. Kebutuhan data dari tim lain

Ditulis di sini supaya tim lain membangun sesuai kebutuhan layar. Kalau belum tersedia, mobile tetap jalan di mode `demo`.

| Dari | Yang dibutuhkan mobile | Dipakai di |
| --- | --- | --- |
| **Tim kontrak** | Fungsi & event sesuai `packages/contracts/src/interfaces/IGroupVault.sol`; alamat deploy testnet; ABI final di `packages/shared` | Semua aksi uang (M4) |
| **Tim indexer (Envio)** | Query: grup milik alamat · detail grup (pot, status, endsAt, approvalThreshold) · `Member` (deposited, used, net, debt, credit) · `Spend` + `SpendShare` · `Activity` per grup · hasil settle (Settled/Pulled/Refunded) | Home, Trip, Payment details, Settled, Invoice |
| **Tim backend (api)** | Profil (nama, kota, negara) · `group_meta` (nama trip, kode undangan) · `spend_meta` (judul, kategori, catatan; validasi `noteHash`) · upload & unduh struk + `group_keys` · invoices · simpan push token · drip gas akun baru | Semua label, struk, invoice, onboarding |

- Mobile menulis query GraphQL acuan di `src/data/live/queries.ts` dan tipe request/response api di `packages/shared`, supaya jadi kontrak bersama.
- Kalau endpoint belum ada, adapter `live` memakai fallback dari spesifikasi: nama = alamat singkat, judul = "Payment".

## 5. Paket kerja (WP)

Kerjakan berurutan sesuai dependensi. Centang di `docs/STATUS.md` › Mobile saat selesai.

| WP | Tujuan | Langkah besar | Selesai kalau | Dep |
| --- | --- | --- | --- | --- |
| **M0 Setup** | Fondasi rilis | Merge `mobile-dev` → `main` · pindah Home ke `/trips` (sekarang bentrok URL `/` dengan Welcome) · `eas.json` (development/preview/production) · dev build iOS & Android · ikon app & splash dari Teko | Dev build jalan di 2 HP; `/` = Welcome, `/trips` = Home | — |
| **M1 Lapisan data** | Layar lepas dari `src/lib/demo.ts` | Buat `src/data` (types + adapter demo) dan hook `src/features/*` dengan TanStack Query · ganti semua import `@/lib/demo` di layar · state loading (skeleton), kosong, dan error per layar | Tidak ada layar yang meng-import `lib/demo`; mode demo tampil identik dengan sekarang | M0 |
| **M2 Spike Mera** | Tahu cara passkey + signing di React Native | `npx expo install @category-labs/mera` · baca source di `node_modules` (jangan menebak API) · buat akun passkey dan tanda tangani 1 transaksi di dev build · cek dukungan PRF | 1 transaksi tertanda tangan; alamat sama di 2 HP; API yang dipakai dicatat di ADR. Kalau gagal: ADR cadangan "Mera lewat in-app browser" | M0 |
| **M3 Sesi & akun** | Login nyata | `src/wallet` (Signer, MeraSigner, DemoSigner) · `SessionProvider` di `app-providers.tsx` · gate route (belum login → Welcome) · splash menunggu sesi · layar 02 memakai Face ID nyata | Buka ulang app langsung ke Home; ganti HP dengan passkey yang sama → akun sama | M2 |
| **M4 Transaksi** | Semua aksi uang bisa dikirim | `src/tx` (kirim, tunggu, status) · mutation hook: createGroup, joinGroup + approve + deposit dalam satu sesi, deposit, spend (+`computeNoteHash`), approve/reject, dispute, payDebt · komponen status "Processing → Done" · peta error ke teks ramah · S4 untuk offline | Mode live dengan kontrak testnet: tiap aksi berhasil dan UI ter-update. Mode demo: aksi disimulasikan | M1, M3, kontrak ter-deploy (untuk live) |
| **M5 Form & validasi** | Input benar | Input nominal (≤ isi pot), date picker tanggal akhir, split Custom (jumlah = nominal), peserta minimal 1, batas approval | Nilai tidak valid tidak bisa dikirim; pesan error sesuai gaya desain | M1 |
| **M6 Data live** | Angka asli | Adapter `live`: query Envio + api · invalidasi query setelah transaksi · fallback label | Jalur demo juri lolos di mode live | M4, indexer + api tersedia |
| **M7 Struk** | R1–R3 nyata | expo-camera / expo-document-picker · kompres · AES-GCM dengan kunci grup · keccak256 ciphertext · upload lewat api · `attachReceipt` · R2 → R3: dekripsi + cocokkan hash | Struk dari HP A bisa dibuka di HP B; hash cocok dengan on-chain | M4, M6 |
| **M8 Invoice** | I1–I3 lengkap | Data invoice dari Envio + api · Pay → `payDebt` · Save as PDF (expo-print) · Share · QR asli ke tautan verifikasi (ganti `invoice/qr-pattern.ts`) | PDF tersimpan; invoice Due jadi Paid setelah dibayar | M6 |
| **M9 Undangan & deep link** | Gabung dari link | `tekosoe://invite/<code>` + universal link (butuh `.well-known` dari `apps/web`) · share sheet di layar 04 | Link dari HP A membuka layar 05 di HP B | M4 |
| **M10 Rilis & QA** | Siap juri | Skrip cek kata terlarang di UI · aksesibilitas dasar · reduce motion · uji 3 HP end-to-end · EAS build APK + TestFlight | Definisi selesai di bagian 1 terpenuhi | M4–M9 |
| **M11 P1/P2** | Tambahan | Feed real-time · push (expo-notifications) · kartu simulasi ke toko demo · kunci PRF | Sesuai FR-14, FR-15, FR-16, FR-17, FR-18 | M10 aman |

**Bisa dikerjakan sambil menunggu backend:** M0, M1, M2, M3, M5. M4 dan M6 memakai adapter demo sampai kontrak dan indexer siap.

### Peta dependensi

```
M0 ─┬─> M1 ─┬─> M5
    │       └───────────┐
    └─> M2 ─> M3 ───────┴─> M4 ─┬─> M6 ─┬─> M7
                                │        └─> M8
                                └─> M9
M4..M9 ─> M10 ─> M11
(kontrak ter-deploy) ─> M4 live      (indexer + api) ─> M6
```

## 6. Timeline

| Tanggal | WP |
| --- | --- |
| 28–29 Sep | M0, M1, M2 (spike Mera di hari pertama) |
| 30 Sep – 2 Okt | M3, M5, M4 di mode demo |
| 3–6 Okt | M4 + M6 di mode live (setelah kontrak & indexer siap), M7, M8, M9 |
| 7–8 Okt | M11, hanya kalau P0 aman |
| 9–11 Okt | M10: uji 3 HP, build EAS, rekam video |
| 12 Okt | Submit |

## 7. Cara kerja agent mobile

1. Baca `apps/mobile/AGENTS.md` (aturan app, desain, peta route, jebakan yang sudah diketahui).
2. Ambil **satu WP** yang semua dependensinya ✅ di `docs/STATUS.md` › Mobile.
3. Buat branch `feat/mobile-<wp>` dari `main`, commit kecil dengan pesan konvensional (`feat(mobile): …`).
4. **Jangan ubah tampilan.** Cocokkan dengan canvas Final UI. Kalau desain perlu berubah, tanya user dulu.
5. Pasang library Expo dengan `npx expo install`, dan cek dokumentasi SDK 57 sebelum menulis kode.
6. Menyimpang dari spesifikasi → tulis ADR di `docs/decisions/` dulu.
7. WP selesai = kriteria WP terpenuhi + typecheck/lint/test hijau + dicek di dev build HP + dicentang di `docs/STATUS.md`.

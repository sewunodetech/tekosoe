# Status pengembangan

Dipelihara oleh tim dan agent. Centang item saat selesai **dan** terverifikasi di testnet. Tambah catatan di bawah setiap fase.

## Timeline

| Tanggal | Fokus | Selesai kalau | Status |
| --- | --- | --- | --- |
| 27–29 Sep | Spike Mera (passkey + PRF di iOS/Android), faucet AUSD, uji gas; kontrak v0 + unit test | Satu transaksi AUSD dari akun Mera tanpa MON milik user | ⏳ |
| 30 Sep – 2 Okt | Kontrak lengkap + fuzz, deploy testnet, indexer Envio | Semua event terindeks, saldo indexer = kontrak | ⏳ |
| 3–6 Okt | App P0: onboarding, grup, deposit, spend, settle-up | Skenario demo end-to-end di testnet | ⏳ |
| 7–8 Okt | Feed real-time (P1); mulai enkripsi (P2) bila aman | Feed tanpa refresh manual | ⏳ |
| 9–10 Okt | Uji E2E, uji UX non-kripto, Slither | Semua checklist uji P0 lolos | ⏳ |
| 11 Okt | Video demo, README, write-up | Final | ⏳ |
| 12 Okt | Submit | Status submission lengkap | ⏳ |

## Setup repo

- [x] Monorepo npm workspaces + Turborepo, struktur folder sesuai spesifikasi
- [x] Dokumen perencanaan di `docs/`, panduan agent di `AGENTS.md`
- [x] Scaffold `apps/mobile` (Expo SDK 57), `apps/web` (Next.js 16), `apps/api` (Hono)
- [x] Backend Express (PR #5) dipindah dari `backend/` ke `apps/api`; ADR 0004 (diusulkan)
- [x] api: ABI struct + custom error di `@tekosoe/shared`, skema DB disatukan di Drizzle (`database/` dihapus), push lewat Expo, metadata grup/spend dikunci ke hash on-chain, invoice setelah settle — 38 test api lolos (fake chain, belum testnet). Sisa: `apps/api/docs/coverage.md` › Masih terbuka
- [x] Skeleton `packages/contracts`, `packages/indexer`, `packages/shared` (`database/` dihapus, skema di `apps/api`)
- [ ] `npm install` dan semua workspace lolos `typecheck`
- [x] Foundry (WSL) + `forge-std`: `forge build` lolos, 26 test (termasuk fuzz) lolos

## Mobile (tim kita) — lihat `apps/mobile/ROADMAP.md`

- [x] UI semua layar Final UI + maskot Teko + sistem desain (data demo) — branch `mobile-dev`
- [ ] M0 Setup: merge ke `main`, Home ke `/trips`, `eas.json`, dev build 2 HP, ikon & splash Teko — *Home di `/trips` ✅; sisa: merge, eas.json, dev build, ikon*
- [x] M1 Lapisan data: `src/data` (demo) + hook `src/features/*`, state loading/error lewat `QueryState` — semua layar lepas dari data demo
- [ ] M2 Spike Mera: passkey + sign 1 tx di dev build, ADR hasil — *ADR 0003 + kode ada; belum terverifikasi di dev build 2 HP*
- [ ] M3 Sesi & akun: Signer, SessionProvider, gate route, Face ID nyata — *Signer, SessionProvider, gate 3 cabang (termasuk cek profil), `EXPO_PUBLIC_SIGNER` demo/mera selesai; sisa: uji Face ID di HP, keputusan penyimpanan kunci (lihat Blocker)*
- [x] M4 Transaksi: `src/tx`, semua mutation hook & feedback modal status Processing → Done, error ramah
- [x] M5 Form & validasi
- [ ] M6 Data live: adapter Envio + api — *kode selesai (`src/data/live`, `EXPO_PUBLIC_DATA_SOURCE=live`), typecheck + lint lolos, jalur demo terverifikasi di web; belum diuji end-to-end karena kontrak/indexer/api belum di-deploy*
- [ ] M7 Struk: kamera/PDF, enkripsi, upload, `attachReceipt`, buka R2 → R3 — *UI capture + attachReceipt + unlock passkey selesai*
- [x] M8 Invoice: `payDebt`, PDF via expo-print, share, QR asli ke tautan verifikasi web
- [x] M9 Undangan & deep link: skema tekosoe://, universal link, dan companion web /j/[code]
- [ ] M10 Rilis & QA: kata terlarang, a11y, uji 3 HP, EAS build
- [ ] M11 P1/P2: feed real-time, push, kartu simulasi, kunci PRF
- [x] Desain P1 Set up profile + P2 Profile di canvas Final UI (28 Sep)
- [ ] M12 Profil & akun: layar P1 + tab P2, simpan ke `profiles` lewat api, Sign out — *UI P1 + tab P2 + gate + Sign out + simpan lokal selesai; api `profiles` tersambung di mode live (belum diuji live)*

## Kontrak, indexer, api (30 Sep)

- [x] GroupVault v1 (ADR 0005): undangan bertanda tangan, settle tidak bisa macet karena akun AUSD beku, permit AUSD (join/deposit/payDebt satu transaksi), `positionOf`. 26 test Foundry. **Ter-deploy** di `0x1467c9de54C1e4570AF062E80E860F94852BB7ee` (terverifikasi: `ausd()` = AUSD Agora).
- [x] Indexer Envio v3: 12 handler, tervalidasi `codegen` + `tsc` di WSL. Belum di-host.
- [x] api: ABI dari `forge build`, `invite_code_hash` dihapus (migrasi 0002). Belum di-deploy.
- [x] AUSD Agora terverifikasi (alamat, 6 desimal, permit, faucet `requestFunds`).

## Gambaran semua tim (per lapisan) — lihat `docs/ROADMAP.md`

### P0 — Wajib

- [ ] Onboarding passkey Mera; masuk lagi di perangkat lain dengan akun sama (FR-01, FR-02)
- [ ] Gas tanpa MON milik user (FR-03)
- [ ] Buat grup + link undangan (FR-04, FR-05)
- [ ] Gabung + pullCap + setoran awal (FR-05, FR-06)
- [ ] Pakai kas + untuk siapa (FR-07, FR-08)
- [ ] Persetujuan di atas batas (FR-09)
- [ ] Keberatan bagian (FR-10)
- [ ] Settle otomatis via penjadwal + tagihan (FR-11, FR-12)
- [ ] UI tanpa istilah kripto, nominal dolar (FR-13)
- [ ] Metadata di database via API, hash cocok `noteHash`
- [ ] Struk: enkripsi di HP, `attachReceipt`, buka dengan Face ID (FR-19, FR-20)
- [ ] Invoice per anggota: Paid/Refunded/Due, Pay, PDF (FR-22)

### P1 — Envio

- [ ] Indexer HyperIndex untuk semua event
- [ ] Feed real-time (FR-14), saldo & perkiraan settle-up (FR-15)
- [ ] OCR struk (FR-21); PDF invoice server + email (FR-23)

### P2 — Mera PRF

- [ ] Kartu simulasi (FR-16)
- [ ] Kunci enkripsi turunan passkey, kunci grup (FR-17)

### P3 — Alchemy

- [ ] Gas Manager dengan akun Mera (maks. setengah hari)
- [ ] Webhooks → push notification (FR-18)

## Catatan deploy

| Item | Nilai |
| --- | --- |
| GroupVault v1 (Monad testnet) | `0x1467c9de54C1e4570AF062E80E860F94852BB7ee` — blok 66921819, tx `0xdb7fc5e2da71b71ae27ad0d72025215c52588d8fa93b4243b7987bb913731dcb` |
| AUSD testnet | `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC` (terverifikasi: docs Agora + on-chain) |
| Faucet AUSD testnet | `0xd236c18D274E54FAccC3dd9DDA4b27965a73ee6C` — `requestFunds(address)` |
| Envio GraphQL | — |
| API | — |
| Contoh hash transaksi | — |

## Blocker & pertanyaan terbuka

- Apakah SDK Mera + ekstensi PRF jalan di React Native? (spike hari pertama; cadangan: in-app browser dengan domain yang sama)
- Kompatibilitas Alchemy Gas Manager dengan EOA Mera
- Model bisnis untuk pitch belum dipilih
- **Keamanan (mobile, perlu keputusan):** `SessionProvider` menyimpan `prfOutput` (= private key akun) permanen di SecureStore tanpa `requireAuthentication`, jadi Face ID hanya diminta sekali. Opsi: minta Face ID tiap buka app (simpan hanya `credentialId`, turunkan kunci lewat `getPasskeyPrfOutput`), atau SecureStore dengan `requireAuthentication: true`. dan object storage struk — lihat `docs/decisions/0002-database-provider.md`

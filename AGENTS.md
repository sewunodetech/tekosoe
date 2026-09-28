# Tekosoe — panduan agent

Tekosoe adalah **shared wallet untuk trip lintas negara yang settle-up sendiri**: anggota grup (maks. 10) menyetor AUSD ke satu kas, siapa pun boleh memakai kas sampai habis, dan di tanggal berakhir kontrak `GroupVault` di Monad testnet menghitung serta melunasi siapa bayar ke siapa. User masuk hanya dengan Face ID (passkey Mera) — tanpa seed phrase, tanpa token gas.

Proyek hackathon **Monad Metropolis**, track Consumer Products & Payments. Target submit **12 Okt 2026** (deadline 13 Okt 23.59 ET).

## Sumber kebenaran

Dokumen perencanaan ada di [`docs/`](docs/README.md). Baca dokumen yang relevan **sebelum** mengerjakan fitur — jangan menebak dari nama fungsi.

| Kalau kamu mengerjakan… | Baca dulu |
| --- | --- |
| Fitur apa pun | [`docs/STATUS.md`](docs/STATUS.md) (apa yang sudah/belum), [`docs/02-prd.md`](docs/02-prd.md) (FR/NFR) |
| Kontrak, indexer, backend, DB | [`docs/03-spesifikasi-teknis.md`](docs/03-spesifikasi-teknis.md) (di sana "Supabase" = database metadata; provider belum final, lihat ADR 0002) |
| Layar app | [`docs/06-peta-layar.md`](docs/06-peta-layar.md), [`docs/05-user-flow.md`](docs/05-user-flow.md), [`docs/04-user-stories.md`](docs/04-user-stories.md) |
| Prioritas, uji, timeline | [`docs/07-rencana-pengembangan.md`](docs/07-rencana-pengembangan.md) |
| Alasan bisnis | [`docs/01-brd.md`](docs/01-brd.md) |
| Keputusan yang sudah diambil | [`docs/decisions/`](docs/decisions/) |

Dokumen asli (live) ada di Claude Docs: "Tekosoe — Dokumen Produk" dan "Monad Metropolis — Dokumen Pengembangan". Salinan di `docs/` adalah snapshot; kalau berbeda, tanya user mana yang benar.

## Peta repo

```
apps/mobile        Expo (React Native) + Expo Router — semua interaksi user
apps/web           Next.js statis — verifikasi invoice, link undangan, file domain passkey
apps/api           Hono di Docker — penjadwal settle, gas/drip MON, satu-satunya pintu ke database, push
packages/contracts Foundry — GroupVault.sol
packages/indexer   Envio HyperIndex — sumber data baca untuk uang
packages/shared    ABI, alamat, chain, tipe, skema metadata (zod) — dipakai semua paket
database/          migrasi Postgres (Neon/Supabase — belum final, lihat ADR 0002)
docs/              BRD, PRD, spesifikasi, user stories, flow, peta layar, rencana, keputusan
```

Setiap folder punya `AGENTS.md` sendiri dengan aturan lokal. Baca itu juga saat bekerja di dalamnya.

## Aturan yang tidak boleh dilanggar

1. **Uang hanya on-chain.** Saldo, pemakaian, dan settle hanya ada di kontrak dan dibaca lewat Envio. Database metadata tidak pernah menyimpan saldo.
2. **Tidak ada custody.** Kunci user tidak pernah keluar dari perangkat. Backend hanya memegang kunci untuk gas dan DB — tidak pernah dana atau kunci user.
3. **Satu account layer: Mera.** Tidak ada Privy, WalletConnect, atau "connect wallet".
4. **Tidak ada istilah kripto di layar user.** Kata "wallet", "gas", "seed phrase", "blockchain", "token", "hash" tidak boleh muncul di UI. Nominal selalu dalam dolar.
5. **AUSD 6 desimal.** Simpan sebagai `bigint` unit terkecil; konversi ke dolar hanya di lapisan tampilan.
6. **Integrasi sponsor harus nyata di testnet**, bukan mock (kecuali mock token khusus untuk uji reentrancy).
7. **Rahasia tidak pernah di-commit.** Hanya `.env.example`. `DATABASE_URL` dan kredensial storage hanya di `apps/api`.
8. **Mera belum terdokumentasi baik.** Setiap nama fungsi `@category-labs/mera` wajib diverifikasi dari source paket di `node_modules` atau repo contoh publik. Jangan mengarang API.
9. **Scope berlapis P0 → P1 → P2 → P3.** Jangan mulai lapisan berikutnya sebelum lapisan sebelumnya jalan end-to-end di testnet. Kalau waktu mepet, potong dari P3, lalu P2 — tidak pernah dari P0.
10. Untuk library apa pun (Expo, Next.js, viem, Hono, Envio, Neon/Supabase, Foundry), ambil dokumentasi terbaru (Context7 / docs resmi) — versi di repo ini lebih baru dari data latih.

## Alur kerja agent

1. **Orientasi.** Baca `docs/STATUS.md` dan `AGENTS.md` folder yang akan disentuh. Cari FR/US yang relevan.
2. **Rencana singkat.** Sebutkan FR/US yang dikerjakan dan file yang akan diubah. Kalau menyentuh kontrak ↔ indexer ↔ app, kerjakan berurutan: kontrak → `packages/shared` (ABI) → indexer → api → app.
3. **Implementasi** mengikuti spesifikasi. Kalau spesifikasi ambigu atau kamu harus menyimpang, catat di `docs/decisions/` (format ADR singkat) — jangan diam-diam.
4. **Verifikasi** sebelum bilang selesai: `pnpm typecheck`, `pnpm lint`, `pnpm test`; kontrak juga `forge test` (dan fuzz untuk invariant saldo).
5. **Update `docs/STATUS.md`**: centang item yang selesai, tambah catatan (alamat kontrak, hash transaksi testnet, blocker).
6. **Commit kecil** dengan pesan konvensional (`feat(contracts): ...`, `fix(mobile): ...`). Riwayat commit selama hackathon dinilai juri.

## Perintah

```bash
pnpm install              # semua workspace
pnpm dev                  # jalankan semua dev server via turbo
pnpm build | lint | typecheck | test
pnpm --filter @tekosoe/mobile start      # Expo
pnpm --filter @tekosoe/contracts test    # forge test
pnpm --filter @tekosoe/indexer codegen   # envio codegen
```

## Fakta jaringan

- Monad testnet, chain ID **10143**.
- AUSD testnet (dari catatan peserta lain, **belum diverifikasi**): `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC` — cocokkan dengan halaman contract deployments Agora sebelum dipakai.

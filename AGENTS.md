# Tekosoe — panduan agent

Tekosoe adalah **shared wallet untuk trip lintas negara yang settle-up sendiri**: anggota grup (maks. 10) menyetor AUSD ke satu kas, siapa pun boleh memakai kas sampai habis, dan di tanggal berakhir kontrak `GroupVault` di Monad testnet menghitung serta melunasi siapa bayar ke siapa. User masuk hanya dengan Face ID (passkey Mera) — tanpa seed phrase, tanpa token gas.

Proyek hackathon **Monad Metropolis**, track Consumer Products & Payments. Target submit **12 Okt 2026** (deadline 13 Okt 23.59 ET).

## Sumber kebenaran

Dokumen perencanaan ada di [`docs/`](docs/README.md). Baca dokumen yang relevan **sebelum** mengerjakan fitur — jangan menebak dari nama fungsi.

| Kalau kamu mengerjakan… | Baca dulu |
| --- | --- |
| Memilih pekerjaan berikutnya | [`docs/ROADMAP.md`](docs/ROADMAP.md) (semua tim) · **mobile:** [`apps/mobile/ROADMAP.md`](apps/mobile/ROADMAP.md) |
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
apps/api           Express di Docker (ADR 0004) — penjadwal settle, gas/drip MON, satu-satunya pintu ke database (skema + migrasi Drizzle di apps/api/drizzle), push
packages/contracts Foundry — GroupVault.sol
packages/indexer   Envio HyperIndex — sumber data baca untuk uang
packages/shared    ABI, alamat, chain, tipe, skema metadata (zod) — dipakai semua paket
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
10. Untuk library apa pun (Expo, Next.js, viem, Express, Drizzle, Envio, Neon/Supabase, Foundry), ambil dokumentasi terbaru (Context7 / docs resmi) — versi di repo ini lebih baru dari data latih.

## Alur kerja agent

1. **Orientasi.** Buka roadmap tim-mu (`docs/ROADMAP.md`, atau `apps/mobile/ROADMAP.md` untuk mobile) dan ambil **satu paket kerja (WP)** yang semua dependensinya sudah ✅ di `docs/STATUS.md`. Baca `AGENTS.md` folder yang akan disentuh dan FR/US yang relevan.
2. **Rencana singkat.** Sebutkan FR/US yang dikerjakan dan file yang akan diubah. Kalau menyentuh kontrak ↔ indexer ↔ app, kerjakan berurutan: kontrak → `packages/shared` (ABI) → indexer → api → app.
3. **Implementasi** mengikuti spesifikasi. Kalau spesifikasi ambigu atau kamu harus menyimpang, catat di `docs/decisions/` (format ADR singkat) — jangan diam-diam.
4. **Verifikasi** sebelum bilang selesai: `npm run typecheck`, `npm run lint`, `npm test`; kontrak juga `forge test` (dan fuzz untuk invariant saldo).
5. **Update `docs/STATUS.md`**: centang item yang selesai, tambah catatan (alamat kontrak, hash transaksi testnet, blocker).
6. **Commit kecil** dengan pesan konvensional (`feat(contracts): ...`, `fix(mobile): ...`). Riwayat commit selama hackathon dinilai juri.

## Perintah

```bash
npm install                                 # sekali di root — semua workspace (npm workspaces)
npm run dev                                 # semua dev server via turbo
npm run build | lint | typecheck | test
npm run docker:up | docker:down | docker:logs   # semua kecuali mobile di Docker (docker-compose.yml)
npm run start -w @tekosoe/mobile            # Expo
npm test -w @tekosoe/contracts              # forge test
npm run codegen -w @tekosoe/indexer         # envio codegen
npm install <pkg> -w @tekosoe/api           # tambah dependensi ke satu workspace (selalu dari root)
cd apps/mobile && npx expo install <pkg>   # khusus mobile: versi cocok dengan SDK Expo
```

## Fakta jaringan

- Monad testnet, chain ID **10143**.
- AUSD testnet (Agora, **terverifikasi** di docs.agora.finance › Contract Deployments + on-chain): `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC` — 6 desimal, permit EIP-2612 (domain "Agora Dollar" v1), EIP-3009, akun bisa dibekukan (`isAccountFrozen`).
- Faucet AUSD testnet: `0xd236c18D274E54FAccC3dd9DDA4b27965a73ee6C`, `requestFunds(address)`. Konstanta di `@tekosoe/shared` (`chain.ts`).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

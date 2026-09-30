# packages/indexer

Envio HyperIndex **v3** — **sumber data baca untuk semua hal soal uang**: daftar grup, feed, saldo per anggota, status spend, hasil settle. App membaca GraphQL Envio; kontrak hanya dibaca langsung untuk cek ulang saldo sebelum transaksi penting. Monad testnet (10143) didukung HyperSync (`https://10143.hypersync.xyz`).

- `config.yaml` — event harus identik dengan `packages/contracts/src/interfaces/IGroupVault.sol` (GroupVault v1, ADR 0005). `field_selection` memilih `transaction.hash` dan `transaction.from`. Chain id, alamat kontrak, start block, dan RPC diambil dari env (`${ENVIO_…:-default}`); default-nya GroupVault v1 testnet.
- `.env` (gitignored, salin dari `.env.example`) — `ENVIO_API_TOKEN` untuk HyperSync (sumber utama, gratis di envio.dev/app/api-tokens). RPC publik Monad hanya cadangan (`ENVIO_RPC_FOR=fallback`); tanpa token set `ENVIO_RPC_FOR=sync` (lambat: `eth_getLogs` dibatasi 100 blok). Envio hanya membaca variabel berawalan `ENVIO_`.
- `schema.graphql` — Group, Member, Spend, SpendShare, Receipt, Activity. Relasi memakai `group: Group!` / `spend: Spend!` (kolom `group_id` / `spend_id`) + `@derivedFrom`.
- `src/EventHandlers.ts` — handler untuk ke-12 event. Di v3, `indexer` dan tipe entitas diimpor dari `"envio"` (tidak ada lagi modul `generated`).

## Aturan

- `Member.net = deposited − used` dengan aturan persis seperti kontrak (termasuk efek `ShareDisputed`).
- `Group.pool`: + Deposited, − SpendExecuted, + Pulled, − Refunded, + DebtPaid. `debt`/`credit` mengikuti `remainingDebt`/`remainingCredit`.
- Setiap event menulis satu baris `Activity` untuk feed (id `${txHash}-${logIndex}`).
- Target: saldo di indexer == `positionOf` di kontrak untuk setiap anggota.

## Perintah

CLI Envio **tidak jalan di Windows** — pakai WSL/Linux/macOS (Node 22+, Docker untuk `dev`). Kalau memakai salinan di WSL, salin juga `.env` bersama `config.yaml`, `schema.graphql`, dan `src/`.

```bash
npm run codegen   # envio codegen — wajib setelah mengubah config.yaml / schema.graphql
npx tsc -p tsconfig.json   # typecheck handler (setelah codegen)
npm run dev       # envio dev (butuh Docker)
```

Alternatif tanpa WSL: `npm run docker:up` di root menjalankan `envio start` di container Linux (`Dockerfile` di folder ini) bersama Hasura. Database-nya Neon (`ENVIO_PG_*` + `HASURA_GRAPHQL_DATABASE_URL` di `.env`): pakai database **terpisah** dari api karena Envio bisa `DROP SCHEMA … CASCADE` saat reset, host langsung (bukan `-pooler`), dan `ENVIO_PG_SSL_MODE=require` (wajib di mode production).

API Envio berubah antar versi: cek dokumentasi terbaru (docs.envio.dev › HyperIndex v3) sebelum menulis handler.

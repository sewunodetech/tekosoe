# packages/indexer

Envio HyperIndex (v3) — **sumber data baca untuk semua hal soal uang**: daftar grup, feed, saldo per anggota, status spend, hasil settle. App membaca GraphQL Envio; kontrak hanya dibaca langsung untuk cek ulang saldo sebelum transaksi penting.

- `config.yaml` — event harus identik dengan `packages/contracts/src/interfaces/IGroupVault.sol`. Isi `address` dan `start_block` setelah deploy.
- `schema.graphql` — entitas Group, Member, Spend, SpendShare, Activity (spesifikasi › Event & skema indexer Envio).
- `src/EventHandlers.ts` — skeleton; baru `GroupCreated` yang ditulis.

## Aturan

- `Member.net = deposited − used` dengan aturan persis seperti kontrak (termasuk efek `ShareDisputed`, `Pulled`, `Refunded`, `DebtPaid`).
- Setiap event menulis satu baris `Activity` untuk feed.
- Target P1: semua 12 event terindeks, dan saldo di indexer == `balanceOf` di kontrak untuk setiap anggota.

## Perintah

```bash
npm run codegen   # envio codegen — wajib setelah mengubah config.yaml / schema.graphql
npm run dev       # envio dev (butuh Docker)
```

API Envio berubah antar versi: cek dokumentasi terbaru (Context7 `/enviodev/hyperindex`) sebelum menulis handler.

# 0013 — Utang yang belum lunas menghalangi trip baru

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

Di GroupVault v1 (ADR 0005), kekurangan yang tidak tertutup safety net saat settle-up menjadi `debt`. Debt itu bisa dibayar kapan saja lewat `payDebt`, tetapi tanpa batas waktu dan tanpa konsekuensi: anggota yang tidak pernah membayar tetap bisa membuat dan ikut trip lain, sementara anggota yang punya `credit` menunggu tanpa kepastian.

Membekukan saldo (fitur freeze AUSD) bukan pilihan: kemampuan itu milik Agora sebagai penerbit untuk kepatuhan hukum, kontrak kita tidak punya izinnya, dan memakainya melanggar aturan "tanpa custody". Kontrak justru dirancang supaya akun yang dibekukan Agora tidak memacetkan settle-up.

## Decision

- `GroupVault` menyimpan `outstandingDebt[address]` = total `debt` anggota itu di semua trip vault ini. Bertambah di `_pullDebtors` (sisa yang tidak bisa ditarik), berkurang di `payDebt` / `payDebtWithPermit`.
- `createGroup`, `joinGroup`, dan `joinGroupWithPermit` revert dengan `OutstandingDebt()` selama `outstandingDebt[msg.sender] > 0`.
- Trip yang sudah diikuti **tidak** terpengaruh: setor, bayar, menyetujui, keberatan, dan settle tetap jalan. Yang dihalangi hanya trip baru.
- View baru `outstandingDebtOf(address)`. Tidak ada event baru: Envio sudah punya `Member.debt` per trip.
- App menahan tombol "Create trip" dan "Join" lebih dulu (Envio: `Member` dengan `debt > 0`) dan menampilkan "You still owe $X" dengan tombol Pay ke invoice trip tersebut. Error kontrak dipetakan ke pesan yang sama di `tx/errors.ts`.
- Invariant baru (diuji, termasuk fuzz): `outstandingDebtOf(m) == Σ debt[g][m]`.

## Consequences

- **Kontrak baru harus di-deploy** (v1 tidak bisa di-upgrade). Trip di kontrak lama tetap ada on-chain tetapi tidak terlihat dari app setelah alamat diganti; itu hanya data uji testnet.
- Setelah deploy: perbarui `GROUP_VAULT_TESTNET_ADDRESS` + `GROUP_VAULT_TESTNET_START_BLOCK` di `packages/shared/src/chain.ts`, `packages/indexer/config.yaml`, env api/indexer/mobile (`GROUP_VAULT_ADDRESS`, `ENVIO_GROUP_VAULT_ADDRESS`, `ENVIO_START_BLOCK`, `EXPO_PUBLIC_GROUP_VAULT_ADDRESS`), lalu sinkron ulang Envio dari blok deploy (sekalian dengan perubahan skema ADR 0012).
- Utang lintas trip menumpuk: membayar satu trip tidak cukup kalau masih ada utang di trip lain.
- Debt tetap tidak punya batas waktu; yang berubah hanya konsekuensinya.

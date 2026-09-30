# 0005 — GroupVault v1: undangan bertanda tangan, settle yang tidak bisa macet, permit AUSD

- Status: diterima (implementasi + 25 test Foundry, belum di-deploy)
- Tanggal: 2026-09-30

## Konteks

Draf spesifikasi (`docs/03-spesifikasi-teknis.md`) punya beberapa celah yang baru terlihat saat kontrak ditulis dan AUSD testnet diperiksa on-chain (`0xa9012a05…22dC`: 6 desimal, EIP-2612 `permit`, EIP-3009, `isAccountFrozen`, proxy upgradeable):

1. `joinGroup(groupId, inviteSecret, pullCap)` membuka rahasia undangan di calldata. Setelah satu orang bergabung, siapa pun bisa memakai rahasia yang sama, atau menyerobot transaksinya.
2. `settle` menarik dan membayar dalam satu loop. Satu akun AUSD yang dibekukan, atau saldo/izin yang kurang, membuat seluruh settle revert dan grup macet selamanya.
3. `approve` AUSD berlaku per vault, bukan per grup; app harus mengirim dua transaksi (approve + join).
4. Event kurang data untuk indexer: `GroupCreated` tanpa `disputeWindow`, `SpendRequested` tanpa `participants/shares/noteHash`. Tidak ada view untuk `debt`, `credit`, `pullCap`.

## Keputusan

- **Undangan**: `Group.inviteKey` (alamat) menggantikan `inviteHash`. Link undangan membawa kunci privat undangan; pendaftar mengirim tanda tangan EIP-191 kunci itu atas `inviteDigest(groupId, joiner) = keccak256(abi.encode(vault, chainId, groupId, joiner))`. Tanda tangan terikat ke pendaftar, jadi tidak bisa dipakai ulang atau diserobot.
- **createGroup** menerima `pullCap` pembuat (pembuat juga anggota).
- **joinGroup(groupId, inviteSig, pullCap, initialDeposit)** sekaligus setor awal; **joinGroupWithPermit / depositWithPermit** memakai permit AUSD sehingga cukup satu transaksi. Permit dibungkus `try` (aman dari front-run).
- **settle tidak pernah revert karena satu anggota**: tarikan = min(kekurangan, `pullCap`, saldo, allowance) lewat `trySafeTransferFrom`; gagal → `debt`. Pembayaran lewat `trySafeTransfer`; gagal → dana ditahan kas sebagai `credit`, bisa diambil dengan **claimCredit**. Pembagian proporsional memberi sisa ke anggota positif terakhir supaya tidak ada debu.
- **payDebt** meneruskan AUSD langsung ke pemilik `credit` (urut anggota).
- Invariant: sebelum settle `sum(deposited − used) == pool`; setelah settle `sum(credit) == sum(debt) + pool` dan saldo AUSD vault == jumlah pool semua grup.
- Event: `GroupCreated` + `disputeWindow`; `SpendRequested` + `participants, shares, noteHash`. View baru: `positionOf`, `spendParticipants`, `spendCount`, `inviteDigest`. `getSpend` revert `SpendNotFound` untuk id yang tidak ada.
- ABI di `@tekosoe/shared` sekarang dihasilkan dari `forge build` (`npm run abi -w @tekosoe/contracts`).
- `foundry.toml`: `evm_version = "prague"` (wajib untuk Monad).

## Konsekuensi

- `group_meta.invite_code_hash` dihapus dari api (migrasi `0002`); detail trip cukup dikunci ke creator on-chain.
- Mobile: link undangan berisi `groupId` + kunci undangan; app menandatangani `inviteDigest` dengan kunci itu (viem `privateKeyToAccount(secret).signMessage({ message: { raw: digest } })`), bukan dengan kunci Mera.
- Allowance tetap satu per vault: anggota di beberapa grup berbagi izin tarik. Tarikan dibatasi allowance yang tersisa; kekurangannya jadi `debt` yang ditampilkan jelas.

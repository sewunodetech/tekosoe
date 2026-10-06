# packages/contracts

Kontrak `GroupVault` (Foundry + OpenZeppelin v5). Spesifikasi: `docs/03-technical-spec.md` › Model data, Spesifikasi fungsi kontrak, Event, Keamanan — dengan perubahan di [ADR 0005](../../docs/decisions/0005-groupvault-v1.md).

## Status

`src/GroupVault.sol` **v1 terimplementasi** (ADR 0005), 25 test termasuk fuzz konservasi nilai, akun AUSD dibekukan, dan reentrancy. Belum di-deploy. `src/interfaces/IGroupVault.sol` adalah kontrak antarmuka yang dipakai app, api, dan indexer — ubah dengan hati-hati.

## Model

- Per anggota: `deposited` dan `used`. Saldo bersih = `deposited − used`.
- `spend` menambah `used[p] += share[p]` untuk tiap peserta; kas berkurang `amount`.
- `disputeShare` memindahkan bagian peserta ke pemakai: `used[p] −= s; used[spender] += s`.
- Undangan: `inviteKey` (alamat); pendaftar membawa tanda tangan EIP-191 kunci undangan atas `inviteDigest(groupId, joiner)`.
- `settle` (setelah `endsAt + disputeWindow`): tarik saldo negatif sampai min(`pullCap`, saldo, allowance) lewat `trySafeTransferFrom`; bayar saldo positif (proporsional kalau kas kurang) lewat `trySafeTransfer`; sisa → `debt` / `credit`. **Tidak pernah revert karena satu anggota** (AUSD bisa membekukan akun).
- `payDebt` langsung meneruskan AUSD ke pemilik `credit`; `claimCredit` mengambil credit yang dananya ditahan kas.
- `joinGroupWithPermit` / `depositWithPermit` memakai permit AUSD (EIP-2612) supaya satu transaksi.
- Maks. 10 anggota → settle cukup satu transaksi dengan loop sederhana.

## Aturan keamanan (wajib)

1. `nonReentrant` + `SafeERC20` di setiap fungsi yang memindahkan AUSD; ubah state **sebelum** transfer.
2. Setiap fungsi memeriksa keanggotaan. Pemakai tidak boleh menyetujui spend miliknya sendiri.
3. Revert kalau `sum(shares) != amount`, `amount > pool`, grup tidak Active, atau sudah lewat `endsAt`.
4. `settle` tidak bisa sebelum `endsAt + disputeWindow` dan tidak bisa dua kali.
5. Invariant: `sum(deposited − used) == pool == saldo AUSD grup di kontrak` (sebelum settle). Setelah settle + semua `payDebt`: total diterima == total dibayar.
6. Catatan dan struk tidak pernah masuk on-chain sebagai teks — hanya `noteHash` / `receiptHash`.

## Uji

Checklist di `docs/07-development-plan.md` › Rencana uji › Kontrak. Minimal: unit test jalur sukses + setiap revert, contoh A/B/C dari spesifikasi (A −10, B −10, C +20), fuzz invariant saldo, uji reentrancy, `slither .` bersih sebelum deploy final.

## Setelah mengubah fungsi/event

Jalankan `forge build && npm run abi -w @tekosue/contracts` (menulis `packages/shared/src/abi/groupVault.ts`), perbarui `packages/indexer/config.yaml`, lalu catat alamat deploy di `docs/STATUS.md`.

## Perintah

```bash
forge build
forge test -vvv
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast   # butuh DEPLOYER_PRIVATE_KEY, AUSD_ADDRESS
```

Dependensi (`@openzeppelin/contracts`, `forge-std`) dipasang lewat `npm install` di root; lihat `remappings.txt`.

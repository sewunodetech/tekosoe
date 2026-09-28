# packages/contracts

Kontrak `GroupVault` (Foundry + OpenZeppelin v5). Spesifikasi lengkap: `docs/03-spesifikasi-teknis.md` › Model data, Spesifikasi fungsi kontrak, Event, Keamanan.

## Status

`src/GroupVault.sol` masih **skeleton**: storage, event, error, dan signature sesuai spesifikasi; semua fungsi mutasi `revert NotImplemented()`. `src/interfaces/IGroupVault.sol` adalah kontrak antarmuka yang dipakai app dan indexer — ubah dengan hati-hati.

## Model

- Per anggota: `deposited` dan `used`. Saldo bersih = `deposited − used`.
- `spend` menambah `used[p] += share[p]` untuk tiap peserta; kas berkurang `amount`.
- `disputeShare` memindahkan bagian peserta ke pemakai: `used[p] −= s; used[spender] += s`.
- `settle` (setelah `endsAt + disputeWindow`): tarik saldo negatif sampai `pullCap` dan selama saldo/allowance cukup; bayar saldo positif (proporsional kalau kas kurang); sisa → `debt` / `credit`.
- `payDebt` langsung meneruskan AUSD ke pemilik `credit`.
- Maks. 10 anggota → settle cukup satu transaksi dengan loop sederhana.

## Aturan keamanan (wajib)

1. `nonReentrant` + `SafeERC20` di setiap fungsi yang memindahkan AUSD; ubah state **sebelum** transfer.
2. Setiap fungsi memeriksa keanggotaan. Pemakai tidak boleh menyetujui spend miliknya sendiri.
3. Revert kalau `sum(shares) != amount`, `amount > pool`, grup tidak Active, atau sudah lewat `endsAt`.
4. `settle` tidak bisa sebelum `endsAt + disputeWindow` dan tidak bisa dua kali.
5. Invariant: `sum(deposited − used) == pool == saldo AUSD grup di kontrak` (sebelum settle). Setelah settle + semua `payDebt`: total diterima == total dibayar.
6. Catatan dan struk tidak pernah masuk on-chain sebagai teks — hanya `noteHash` / `receiptHash`.

## Uji

Checklist di `docs/07-rencana-pengembangan.md` › Rencana uji › Kontrak. Minimal: unit test jalur sukses + setiap revert, contoh A/B/C dari spesifikasi (A −10, B −10, C +20), fuzz invariant saldo, uji reentrancy, `slither .` bersih sebelum deploy final.

## Setelah mengubah fungsi/event

Perbarui `packages/shared/src/abi/groupVault.ts` dan `packages/indexer/config.yaml`, lalu catat alamat deploy di `docs/STATUS.md`.

## Perintah

```bash
forge build
forge test -vvv
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast   # butuh DEPLOYER_PRIVATE_KEY, AUSD_ADDRESS
```

Dependensi (`@openzeppelin/contracts`, `forge-std`) dipasang lewat `pnpm install` di root; lihat `remappings.txt`.

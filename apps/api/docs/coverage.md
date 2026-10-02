# apps/api — cakupan, celah, dan asumsi

Review saat backend dipindah dari `backend/` ke `apps/api` (30 Sep 2026), beserta status perbaikannya. Rujukan: `AGENTS.md`, `apps/api/AGENTS.md`, `packages/contracts/src/interfaces/IGroupVault.sol`, `docs/03-technical-spec.md` › Database off-chain / Invoice.

## Sudah diperbaiki (30 Sep)

1. ✅ **ABI `getGroup` salah bentuk.** Kontrak mengembalikan satu struct `Group` (berisi `string`); ABI lama menulis 8 output terpisah. Sekarang `struct Group`/`struct Spend` ada di `@tekosoe/shared`, dikunci `test/unit/abi.test.ts`.
2. ✅ **Custom error tidak ada di ABI.** Semua error `IGroupVault` masuk ABI shared; "sudah di-settle" = `revertErrorName(error) === "GroupNotActive"`.
3. ✅ **Push Web Push (VAPID) vs Expo.** Diganti Expo Push API (`src/integrations/expoPush.ts`), tabel `push_subs(address, expo_push_token, platform)`, token `DeviceNotRegistered` dihapus. `VAPID_*` dan `web-push` dihapus; `EXPO_ACCESS_TOKEN` opsional.
4. ✅ **Dua skema DB.** `apps/api/src/db/schema.ts` jadi satu-satunya sumber; `database/` dihapus. Migrasi dibuat ulang: `0000_init` + `0001_enable_rls` (RLS tanpa policy, seperti SQL lama). **Kalau ada DB dev yang sudah menjalankan migrasi lama, reset dulu** (drop semua tabel + `drizzle.__drizzle_migrations`).
5. ✅ **Profil tidak cocok dengan app.** Sekarang `displayName`, `countryCode` (ISO 2 huruf), `city`, `avatarColor` — sama dengan `profileSchema` shared.
6. ✅ **Struk memakai `noteHash`.** Sekarang `receiptHash` (= `keccak256(ciphertext)` = nilai `attachReceipt`), diikat ke `spend_id` + `mime`, dan upload ditolak kalau pemakaian tidak ada on-chain.
7. ✅ **Metadata spend** — `PUT /api/groups/:id/spends/:spendId/meta` hanya dari spender, ditolak `422` kalau `computeNoteHash` ≠ `noteHash` on-chain; `GET …/spends/meta`.
8. ✅ **Invoice per anggota** — dibuat dari event `Pulled`/`Refunded` di receipt tx settle; `invoiceHash = keccak256(buildInvoicePayload(...))` dari `@tekosoe/shared` supaya web bisa menghitung ulang. `DebtPaid` → `due` jadi `paid`. Share token 7 hari untuk halaman web.
9. ✅ **Group meta** — hanya creator on-chain; `GET` publik untuk layar undangan. (Sejak ADR 0005 undangan berupa kunci bertanda tangan, jadi `invite_code_hash` dihapus — migrasi `0002`.)
10. ✅ **`spend_reviews` (P1)** — seen + catatan penolak.

## Keputusan yang diambil saat perbaikan

- **Kunci grup** tetap `member_enc_keys` + `group_key_wraps` (versi api), bukan `group_keys(key_version)` dari draf spesifikasi — alurnya butuh kunci publik tiap anggota dan pencatat siapa yang membungkus. Rotasi kunci (`key_version`) belum ada.
- **Isi hash invoice** hanya hasil settle yang bisa dibuktikan dari chain (`pulled`, `refunded`, `remainingDebt`, `remainingCredit`, `settleTxHash`, nomor). Rincian setoran/bagian tiap pemakaian ditampilkan dari Envio, tidak ikut di-hash; status juga tidak.
- **`countryCode`** berupa kode ISO; form mobile menyimpan nama negara ("Australia"), jadi mobile perlu memetakan nama → kode sebelum `PUT /api/profiles/me`.
- **Metadata spend ditulis setelah transaksi `spend`** (butuh `spendId`). Kalau app gagal menulis label, pemakaian tetap ada on-chain tanpa judul.

## Masih terbuka

- **Kontrak belum diimplementasi** (`NotImplemented`), `GROUP_VAULT_ADDRESS`/URL Envio belum ada. Semua perilaku on-chain hanya diuji dengan fake; belum ada yang jalan end-to-end di testnet.
- **Invoice untuk grup yang di-settle anggota** dibuat lewat webhook `Settled` (butuh `FEATURE_PUSH` + Alchemy) atau `POST /api/admin/invoices/:groupId`. Tanpa webhook, scheduler tidak melihat grup yang sudah `Settled` di Envio. Opsi: tambahkan sweep yang mencari grup `Settled` tanpa invoice lewat Envio.
- **Status `paid` setelah `DebtPaid`** juga hanya lewat webhook. App sebaiknya tetap membaca `debt` live dari Envio (`Member.debt`) untuk tombol "Pay".
- **Backfill invoice** berjalan tiap sweep untuk 50 `settle_runs` terbaru; grup `skipped` tanpa tx di Envio akan di-query ulang tiap tick (ringan, tapi bisa dibatasi kalau perlu).
- **Login dari mobile** belum dicoba: tanda tangan EIP-191 lewat `session.signDigest(hashMessage(message))` → 65 byte `r‖s‖v`.
- **Drip tanpa login**: kerugian maksimum ≈ `DRIP_DAILY_CAP × DRIP_AMOUNT_MON` per hari (default 10 MON). Rate limiter di memori — cukup untuk satu instance.
- **Skema Envio**: query `Group` (due) dan `Activity(type: "Settled")` mengikuti draf `packages/indexer/schema.graphql`; cek ulang setelah indexer jadi.
- **Alchemy Webhooks di Monad testnet** belum dipastikan; `webhooks/extract.ts` belum diuji dengan payload asli.
- **Definisi `receiptHash`** (keccak256 ciphertext) perlu disepakati dengan tim mobile (M7).
- `src/lib/money.ts` masih duplikat sebagian `@tekosoe/shared`; ABI masih tulisan tangan — ganti dengan hasil `forge build` setelah kontrak final.
- Tidak ada skrip `lint` di api.
- Build Docker dari root belum diverifikasi (Docker daemon tidak jalan di mesin review).

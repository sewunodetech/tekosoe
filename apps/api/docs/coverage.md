# apps/api — cakupan, celah, dan asumsi

Hasil review saat backend dipindah dari `backend/` ke `apps/api` (30 Sep 2026). Diurutkan dari yang paling mendesak. Rujukan: `AGENTS.md`, `apps/api/AGENTS.md`, `database/migrations/0001_init.sql`, `packages/contracts/src/interfaces/IGroupVault.sol`.

## Harus diperbaiki (bug / tidak cocok dengan lapisan lain)

1. ✅ **ABI `getGroup` salah bentuk** (diperbaiki 30 Sep). Kontrak mengembalikan satu struct `Group` yang berisi `string`, tapi ABI lama menulis 8 output terpisah sehingga decode rusak. Sekarang `getGroup`/`getSpend` ada di `@tekosoe/shared` dengan `struct Group`/`struct Spend`, dan dikunci oleh `test/unit/abi.test.ts`.
2. ✅ **Custom error kontrak tidak ada di ABI** (diperbaiki 30 Sep). Semua error `IGroupVault` masuk ABI shared; "sudah di-settle" dideteksi lewat `revertErrorName(error) === "GroupNotActive"`, bukan regex pesan.
3. **Push memakai Web Push (VAPID), mobile memakai Expo push token.** `notification-provider.tsx` mengambil `getExpoPushTokenAsync()`; `database/…/0001_init.sql` punya `push_subs(expo_push_token, platform)`. Backend menyimpan `endpoint/p256dh/auth` dan mengirim lewat `web-push`, jadi push tidak akan pernah sampai ke HP. Perbaikan: ganti `integrations/webpush.ts` dengan Expo Push API (`expo-server-sdk` atau HTTP ke Expo), body subscribe `{ expoPushToken, platform }`, env `EXPO_ACCESS_TOKEN` (hapus `VAPID_*`).
4. **Dua skema database yang berbeda.** `database/migrations/0001_init.sql` vs `apps/api/drizzle/0000_*.sql`:
   | Tabel | database/ | drizzle (api) |
   | --- | --- | --- |
   | `profiles` | `display_name, city, country_code, avatar_color` | `display_name, avatar` |
   | `group_meta`, `spend_meta`, `spend_reviews`, `invoices` | ada | **tidak ada** |
   | push | `push_subs` (Expo) | `push_subscriptions` (VAPID) |
   | kunci grup | `group_keys(key_version)` | `member_enc_keys` + `group_key_wraps` |
   | struk | per `(group_id, spend_id, n)` + `receipt_hash` | per upload, tanpa `spend_id` |
   | operasional | — | `gas_drips`, `settle_runs`, `auth_nonces`, `processed_events`, `kv_state` |

   Pilih satu sumber kebenaran. Usulan: Drizzle di `apps/api` jadi sumber (karena api satu-satunya klien DB), port tabel yang kurang ke `schema.ts`, lalu jadikan `database/` hanya dokumentasi atau hapus.
5. **Profil tidak cocok dengan app.** Form setup profil mobile berisi `name`, `country`, `city`; `@tekosoe/shared` `profileSchema` mewajibkan `countryCode`. Api hanya menerima `displayName` + `avatar`. Samakan dengan `profileSchema` dari shared.
6. **Struk: `noteHash` dipakai untuk hash ciphertext.** Di kontrak, `noteHash` = hash JSON catatan spend, sedangkan hash ciphertext struk = `receiptHash` (`attachReceipt` / event `ReceiptAttached`). Api menyimpan `keccak256(ciphertext)` di kolom `note_hash` dan tidak mengikat struk ke `spend_id`. Ganti nama ke `receipt_hash`, simpan `spend_id`, dan cek terhadap `receiptHash` on-chain.

## Kurang (P0 yang belum ada di api)

7. **Metadata spend** (`spend_meta`: judul, kategori, catatan) — rute tulis/baca dengan validasi `computeNoteHash(note) === noteHash` on-chain (aturan wajib di `apps/api/AGENTS.md`). Tanpa ini Activity hanya berisi nominal.
8. **Invoice per anggota** (FR-12, FR-22): setelah `settle` terkonfirmasi, buat baris `invoices` dari event `Settled/Pulled/Refunded` — nomor `INV-{trip}-{urutan}`, `invoice_hash = keccak256(canonicalJson)`, status `paid|refunded|due`, plus rute baca untuk app dan untuk halaman verifikasi `apps/web`.
9. **Group meta** (nama tampilan, `invite_code_hash`) bila web companion `/j/[code]` perlu menampilkan grup sebelum join.
10. **P1 `spend_reviews`** (status "Seen", catatan penolak) — belum ada.

## Perlu dirapikan

11. **Duplikasi dengan `@tekosoe/shared`**: ABI sudah diimpor dari shared (salinan `src/chain/abi.ts` dihapus). Sisa: `src/lib/money.ts`. Setelah kontrak final, ganti ABI tulisan tangan dengan hasil `forge build`.
12. **`group_id` sebagai `bigint mode:number`** — aman selama id < 2^53, tapi `database/` memakai `numeric(78,0)`. Samakan saat skema disatukan.
13. **Tidak ada skrip `lint`** di api; `npm run lint` root melewatinya.
14. **Dokumentasi**: `docs/03-spesifikasi-teknis.md` dan ADR 0001 masih menyebut Hono (lihat ADR 0004). `docs/API.md`/`openapi.yaml` harus diperbarui bersamaan dengan poin 3–8.

## Catatan / asumsi yang harus diverifikasi

- **Kontrak belum diimplementasi** (`NotImplemented`), `GROUP_VAULT_ADDRESS` dan URL Envio belum ada — startup check akan gagal kecuali `RELAXED_ENV=true` (jangan di produksi). Belum ada yang diuji end-to-end di testnet.
- **Login dari mobile**: api memverifikasi SIWE dengan `verifyMessage` (EOA). Akun Mera memang EOA secp256k1 (ADR 0003), tapi mobile harus membuat tanda tangan EIP-191 sendiri: `session.signDigest(hashMessage(message))` lalu serialisasi ke 65 byte `r‖s‖v`. Uji satu kali di dev build sebelum membangun rute lain di atasnya.
- **Drip tanpa login** (akun belum ada): dilindungi rate limit per IP, cap harian, klaim sekali per alamat, dan cek saldo. Kerugian maksimum ≈ `DRIP_DAILY_CAP × DRIP_AMOUNT_MON` per hari (default 200 × 0.05 = 10 MON). Rate limiter di memori — cukup untuk satu instance saja.
- **Skema Envio**: query `Group(where: {status: {_eq: "Active"}, endsAt: {_lte: $now}})` mengasumsikan nama field di `packages/indexer/schema.graphql`; `disputeWindow` tidak ada di entity sehingga dibaca dari kontrak (bergantung poin 1).
- **Alchemy Webhooks untuk Monad testnet** belum dipastikan tersedia; parser payload (`webhooks/extract.ts`) belum diuji dengan payload asli.
- **Definisi hash struk** (keccak256 ciphertext) perlu disepakati dengan tim mobile (M7).
- `vitest@5` butuh `vite` sebagai peer — sudah ditambahkan ke devDependencies saat pemindahan. Satu test `/api/status` sebelumnya saling bertentangan (mengharap `ok` padahal wallet palsu bersaldo 0) — ekspektasinya diperbaiki ke `degraded`.

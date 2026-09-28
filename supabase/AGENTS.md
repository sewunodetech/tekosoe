# supabase

Metadata off-chain saja: profil, nama grup, judul/catatan pengeluaran, struk terenkripsi, status baca, langganan push, kunci grup terbungkus, invoice. **Tidak pernah menyimpan saldo** — uang selalu dari kontrak/Envio.

- Migrasi di `migrations/` (penamaan `YYYYMMDDHHMMSS_nama.sql`, dipakai Supabase CLI).
- RLS aktif di semua tabel tanpa policy → `anon` dan `authenticated` ditolak. Hanya `apps/api` (service role) yang mengakses.
- Setiap baris dikunci ke on-chain lewat `group_id` + `note_hash` / `receipt_hash`. Kalau isi DB tidak cocok dengan hash on-chain, app menandai "Unverified".
- Bucket `receipts` privat, path `{group_id}/{spend_id}/{n}.bin`, isi hanya ciphertext AES-GCM.
- Nama, kota, catatan tidak boleh masuk blockchain (publik dan permanen) — itu sebabnya tabel ini ada.

Perintah (Supabase CLI): `supabase link`, `supabase db push`.

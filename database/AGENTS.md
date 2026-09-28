# database

Postgres untuk metadata off-chain saja: profil, nama grup, judul/catatan pengeluaran, status baca, langganan push, kunci grup terbungkus, metadata struk, invoice. **Tidak pernah menyimpan saldo** — uang selalu dari kontrak/Envio.

Provider belum final (kandidat: Neon; spesifikasi awal menulis Supabase) — lihat `docs/decisions/0002-database-provider.md`. SQL di sini sengaja Postgres standar supaya jalan di keduanya. Di dokumen spesifikasi, "Supabase" dibaca sebagai "database metadata".

- Migrasi di `migrations/`, berurutan `NNNN_nama.sql`. Jalankan dengan `psql "$DATABASE_URL" -f migrations/0001_init.sql` (atau tool migrasi yang nanti dipilih).
- Satu-satunya klien adalah `apps/api` lewat `DATABASE_URL`. App mobile dan web tidak pernah terhubung ke database.
- RLS aktif tanpa policy sebagai pengaman untuk role selain pemilik tabel.
- Setiap baris dikunci ke on-chain lewat `group_id` + `note_hash` / `receipt_hash`. Kalau isi DB tidak cocok dengan hash on-chain, app menandai "Unverified".
- File struk **tidak** disimpan di Postgres. Ciphertext AES-GCM disimpan di object storage privat (path `{group_id}/{spend_id}/{n}.bin`); tabel `receipts` hanya menyimpan path dan `receipt_hash`. Pilihan storage (mis. Cloudflare R2 / S3-compatible) ikut ADR 0002.
- Nama, kota, catatan tidak boleh masuk blockchain (publik dan permanen) — itu sebabnya database ini ada.

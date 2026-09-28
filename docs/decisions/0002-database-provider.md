# 0002 — Provider database metadata

- Status: diusulkan (belum final)
- Tanggal: 2026-09-28

## Konteks

Spesifikasi Teknis memilih Supabase (Postgres + Storage) untuk metadata off-chain. Tim mempertimbangkan Neon. Neon hanya menyediakan Postgres — tidak ada object storage dan tidak ada role `anon`/`service_role` bawaan.

## Keputusan sementara

- Folder `supabase/` diganti `database/`; SQL ditulis sebagai Postgres standar.
- `apps/api` terhubung lewat satu `DATABASE_URL` (bukan `SUPABASE_URL` + service role key).
- Struk terenkripsi disimpan di object storage terpisah, dikonfigurasi lewat env `RECEIPTS_STORAGE_*`.

## Yang masih harus diputuskan

- [ ] Neon atau Supabase untuk Postgres.
- [ ] Object storage untuk ciphertext struk kalau memakai Neon (mis. Cloudflare R2 atau S3-compatible lain).
- [ ] Driver/ORM di `apps/api` (mis. `@neondatabase/serverless`, `postgres`, Drizzle).

## Konsekuensi

- Dokumen perencanaan di Claude Docs masih menyebut Supabase; perbarui setelah keputusan final.
- Aturan inti tidak berubah: database hanya metadata, tidak pernah saldo; hanya `apps/api` yang mengakses.

# 0004 — apps/api memakai Express, Drizzle, dan Neon

- Status: diusulkan (perlu konfirmasi tim)
- Tanggal: 2026-09-30

## Konteks

ADR 0001 dan Spesifikasi Teknis memilih Hono untuk `apps/api`, dan `apps/api` baru berisi skeleton Hono kosong. Backend yang benar-benar dibangun (PR #5, awalnya di folder `backend/`) memakai Express 5 dan sudah punya auth, drip, penjadwal settle, profil, struk, kunci grup, push, test, dan OpenAPI.

## Keputusan

- Backend Express dipindah ke `apps/api` dan menggantikan skeleton Hono; nama paket `@tekosoe/api`, satu `package-lock.json` di root.
- Stack api: Express 5, Drizzle ORM + `pg`, migrasi `drizzle-kit` di `apps/api/drizzle/`, S3-compatible untuk ciphertext struk (`S3_*`), login SIWE → JWT HS256.
- Docker dibangun dari root repo: `docker build -f apps/api/Dockerfile .`.

## Konsekuensi

- ADR 0001 (bagian `apps/api`) dan Spesifikasi Teknis masih menyebut Hono — perbarui dokumen live setelah disetujui.
- Pilihan ini ikut menjawab sebagian ADR 0002 (driver: Drizzle + `pg`; storage: S3-compatible), tapi Neon vs Supabase masih terbuka.
- Ada dua sumber skema DB: `database/migrations/0001_init.sql` dan `apps/api/drizzle/`. Harus disatukan (lihat `apps/api/docs/coverage.md`).

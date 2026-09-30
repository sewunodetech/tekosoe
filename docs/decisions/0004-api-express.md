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
- Skema DB hanya di `apps/api/src/db/schema.ts` (migrasi di `apps/api/drizzle/`); folder `database/` dihapus. Kunci grup memakai `member_enc_keys` + `group_key_wraps`, bukan `group_keys` dari draf spesifikasi.
- Push memakai Expo Push API (bukan Web Push), sesuai `push_subs` di spesifikasi.

# apps/api — backend mini

Express 5 (Node 22/TypeScript, ESM, dijalankan dengan `tsx`) dalam Docker, deploy ke Railway. Menyimpang dari spesifikasi awal (Hono) — lihat [ADR 0004](../../docs/decisions/0004-api-express.md). Tugasnya (spesifikasi › Pembagian tugas):

1. **Penjadwal settle** — `setInterval` di dalam proses (`src/modules/settle/scheduler.ts`): cari grup Active yang jatuh tempo lewat Envio, cek `endsAt + disputeWindow` dari kontrak (waktu blok, bukan jam server), `simulate` lalu kirim `settle(groupId)`, backoff eksponensial di `settle_runs`.
2. **Gas** — drip MON sekali per alamat baru (`POST /api/drip`), dibatasi rate limit per IP, cap harian, dan cek saldo minimum.
3. **Satu-satunya pintu ke database** (Postgres via `DATABASE_URL`, Drizzle) dan object storage struk (S3-compatible, presigned URL) — app tidak pernah terhubung langsung.
4. **Push notification** — webhook Alchemy → decode event GroupVault → kirim push lewat Expo (P3, `FEATURE_PUSH`).
5. **Metadata & invoice** — profil, label trip/pemakaian (dikunci ke hash on-chain), invoice per anggota setelah settle.

Referensi endpoint: [`docs/API.md`](docs/API.md), OpenAPI di [`docs/openapi.yaml`](docs/openapi.yaml) (Swagger UI di `GET /api/docs`). Asumsi dan celah terhadap spesifikasi: [`docs/coverage.md`](docs/coverage.md).

## Struktur

```
src/
  index.ts          startup checks (DB, chain id, kode kontrak), listen, job latar, shutdown
  app.ts            urutan middleware + mount router
  config/env.ts     validasi env (zod, fail fast; RELAXED_ENV=true hanya untuk lokal)
  chain/            viem: public client, 2 wallet backend (drip, settler), GroupVault
  db/               schema Drizzle, repos, migrate
  integrations/     Envio GraphQL, S3, Expo push
  middleware/       auth (JWT dari SIWE), cek anggota on-chain, admin key, rate limit, error
  modules/<fitur>/  routes.ts + service.ts per fitur
drizzle/            migrasi hasil drizzle-kit (sumber skema DB untuk api)
test/               vitest + supertest, semua dependensi eksternal di-fake (test/helpers/fakes.ts)
```

## Aturan

- Kunci backend (`DRIP_PRIVATE_KEY`, `SETTLER_PRIVATE_KEY`, harus berbeda) hanya untuk drip MON dan `settle`. **Tidak pernah** memegang dana atau kunci user.
- Setiap rute metadata: login SIWE (EIP-4361, ditandatangani EIP-191 oleh kunci Mera) → JWT, lalu cek keanggotaan grup **on-chain** (`membersOf`, bukan Envio) sebelum baca/tulis.
- Tolak metadata spend yang `computeNoteHash` (dari `@tekosoe/shared`) tidak sama dengan `noteHash` on-chain (`modules/groups`).
- `DATABASE_URL` dan kredensial `S3_*` hanya ada di sini. Database tidak pernah menyimpan saldo, anggota, atau pemakaian.
- Kalau DB mati, uang tetap tampil dari Envio — api tidak boleh menjadi jalur wajib untuk data uang. Backend bukan proxy GraphQL.
- Teks push/error untuk user tanpa istilah kripto, nominal dolar (`formatAusd`).
- Job harus idempotent dan dihentikan saat shutdown.
- Migrasi dijalankan sebagai pre-deploy (`npm run db:migrate -w @tekosoe/api`), tidak otomatis saat start.
- Invoice: nomor `INV-{trip}-{urutan}`, `invoice_hash = keccak256(buildInvoicePayload(...))` dari `@tekosoe/shared` (web memakai fungsi yang sama untuk verifikasi), status `paid | refunded | due` (tidak ikut di-hash). Pembuatan invoice tidak boleh menghalangi settle.
- Skema DB hanya di `src/db/schema.ts`; ubah skema → `npm run db:generate -w @tekosoe/api`, jangan edit migrasi yang sudah di-deploy.
- Push hanya lewat Expo Push API (`integrations/expoPush.ts`); app mengirim Expo push token.

## Perintah

```bash
cp apps/api/.env.example apps/api/.env      # isi; RELAXED_ENV=true untuk coba tanpa env lengkap
npm run dev -w @tekosoe/api
npm test -w @tekosoe/api
npm run typecheck -w @tekosoe/api
npm run db:generate -w @tekosoe/api         # setelah mengubah src/db/schema.ts
npm run db:migrate -w @tekosoe/api          # pakai DATABASE_URL_UNPOOLED
docker build -f apps/api/Dockerfile .       # dari root repo
```

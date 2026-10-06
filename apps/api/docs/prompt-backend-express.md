# Prompt: Generate Backend Tekosue (Express.js)

**Cara pakai:** buka Claude Code (atau AI coding tool lain) di root monorepo, lampirkan `Tekosue_-_Dokumen_Produk.md`, lalu tempel semua isi di bawah garis ini sebagai prompt.

---

## 1. Peran & tujuan

Kamu adalah senior backend engineer TypeScript. Bangun **backend mini Tekosue** di `apps/api` memakai **Express.js**, sesuai dokumen produk terlampir (BRD, PRD, Spesifikasi Teknis, User Stories, User Flow). Dokumen itu adalah sumber kebenaran. Kalau prompt ini bertentangan dengan dokumen, ikuti dokumen dan catat pertentangannya di `docs/coverage.md`.

Tekosue adalah aplikasi mobile untuk kas bersama lintas negara. User menyetor AUSD ke satu kas grup di kontrak Monad testnet, memakainya, lalu di tanggal grup berakhir kontrak menyelesaikan siapa bayar ke siapa. User login dengan passkey (Mera) dan tidak pernah memegang token gas.

Tujuan kerjamu: backend yang **menutup semua flow yang memang butuh backend**, tidak lebih dan tidak kurang, lengkap dengan test, dokumentasi, dan siap deploy ke Railway.

## 2. Prinsip arsitektur (tidak boleh dilanggar)

1. Backend **tidak pernah memegang kunci atau dana user**. Kunci milik backend hanya dipakai untuk (a) mengirim MON kecil ke akun baru dan (b) memanggil `settle`.
2. **Kontrak + Envio adalah sumber kebenaran** untuk semua data uang (grup, anggota, saldo, pemakaian). Database hanya menyimpan data non-chain. Jangan menyalin saldo, anggota, atau pemakaian ke database.
3. Frontend membaca Envio langsung. Backend **tidak menjadi proxy GraphQL**.
4. `inviteSecret` tidak pernah dikirim ke backend dan tidak pernah dilog. Link undangan dibuat dan dibuka di frontend.
5. Semua job harus **idempotent** dan aman dijalankan ulang.
6. Teks yang bisa sampai ke layar user (push notification, pesan error yang ditujukan ke user) **tidak boleh** memuat kata "wallet", "gas", "seed phrase", atau "blockchain" (NFR-07). Nominal ditulis dalam dolar, mis. `$12.50`.
7. Backend tidak mengimplementasikan relayer/meta-transaction. Jalur gas yang dipilih adalah **drip MON**. Alchemy Gas Manager berjalan di frontend dan tidak butuh backend.

## 3. Tech stack (tetap)

- Node.js 22, TypeScript strict, ESM, **Express 5**
- PostgreSQL di Neon, `pg` + **Drizzle ORM** + `drizzle-kit` untuk migrasi
- `viem` untuk chain, `zod` untuk validasi, `jose` untuk JWT, `pino` + `pino-http` untuk log
- `helmet`, `cors`, `express-rate-limit`
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (S3-compatible, dipakai untuk Neon Object Storage)
- `web-push` untuk push notification
- `vitest` + `supertest` untuk test
- Scheduler: **`setInterval` di dalam proses Express** (bukan Railway cron, bukan library cron)
- Package manager pnpm; kode ada di `apps/api` dalam monorepo. Kalau `packages/shared` (ABI, alamat, tipe) sudah ada, pakai. Kalau belum, buat `src/chain/abi.ts` dari daftar di bagian 6 dan tandai `// TODO: replace with @tekosue/shared`.

Struktur yang diharapkan:

```
apps/api/
  src/
    index.ts               # bootstrap, start scheduler, graceful shutdown
    app.ts                 # createApp(deps) supaya mudah dites
    config/env.ts          # env divalidasi zod, fail fast
    db/                    # client.ts, schema.ts, migrate.ts
    chain/                 # clients.ts, abi.ts, wallets.ts (mutex per wallet), groupVault.ts
    integrations/          # envio.ts, storage.ts (S3), webpush.ts
    middleware/            # auth, validate, error, rateLimit, adminKey
    modules/
      health/  onboarding/  settle/  auth/  profiles/  receipts/  keys/  push/  webhooks/
    lib/                   # address.ts, errors.ts, logger.ts, money.ts, mutex.ts
  test/
  drizzle/                 # migrasi
  Dockerfile  .env.example  drizzle.config.ts  README.md
docs/coverage.md
```

Aturan kode: route tipis, logika di service, akses DB di repository, dependency (db, chain client, envio client, storage) di-inject lewat `createApp(deps)` supaya bisa di-mock. Komentar kode dalam bahasa Inggris.

## 4. Pemetaan flow PRD ke backend

| Flow / kebutuhan PRD | Peran backend | Modul |
| --- | --- | --- |
| FR-03, US-01: transaksi pertama berhasil walau akun tidak punya MON | Kirim MON kecil ke akun baru | `onboarding` |
| FR-11, US-09: settle-up otomatis di tanggal berakhir | Scheduler memanggil `settle` | `settle` |
| FR-12, US-10: melunasi tagihan (`payDebt`) | Tidak ada. Frontend langsung ke kontrak | - |
| FR-14, FR-15, US-11: feed dan saldo | Tidak ada. Frontend langsung ke Envio | - |
| FR-01, FR-02, FR-04 sampai FR-10, FR-16 | Tidak ada. Frontend + Mera + kontrak | - |
| Layar 5, 7, 13: nama anggota terbaca, bukan `0x...` (**asumsi, tidak ada di dokumen**) | Simpan dan sajikan profil | `profiles` (+ `auth`) |
| FR-17, US-13: struk terenkripsi (P2) | Simpan ciphertext, kelola kunci grup terenkripsi | `receipts`, `keys` |
| FR-18, US-14: notifikasi (P3) | Terima webhook, kirim push | `push`, `webhooks` |
| Operasional demo | Health, status, trigger settle manual | `health`, `settle` (admin) |

## 5. Spesifikasi modul

Semua endpoint di bawah prefix `/api`, kecuali `/health`. Format error seragam: `{ "error": { "code": "SNAKE_UPPER", "message": "...", "details": {} } }`. Alamat selalu dinormalisasi (`getAddress` untuk output, lowercase di DB).

### 5.0 Foundation

- `app.set('trust proxy', 1)` (Railway ada di belakang proxy, rate limit harus membaca IP asli).
- `helmet`, CORS allowlist dari `CORS_ORIGINS`, `express.json({ limit: '100kb' })`, request id, `pino-http` dengan redact untuk header `authorization` dan `x-admin-key`.
- Middleware `validate(schema)` berbasis zod, error handler global, handler 404.
- Saat start: validasi env, cek `chainId` RPC sama dengan `CHAIN_ID` (10143), cek ada kode kontrak di `GROUP_VAULT_ADDRESS`, cek `DRIP_PRIVATE_KEY` berbeda dari `SETTLER_PRIVATE_KEY`, cek koneksi DB. Kalau gagal, proses berhenti dengan pesan jelas.
- Graceful shutdown pada `SIGTERM`: hentikan scheduler dan interval lain, tutup server dan pool DB.

### 5.1 Health & status (`health`)

- `GET /health`: liveness tanpa dependensi, balas `{ "status": "ok" }`. Dipakai healthcheck Railway.
- `GET /api/status` (header `x-admin-key`): ping DB, blok terbaru RPC, ping Envio, status scheduler (`lastTickAt`, `lastTickDurationMs`, `lastError`, `dueCandidates`), saldo MON wallet drip dan settler beserta flag `low` (di bawah `LOW_BALANCE_THRESHOLD_MON`). Jangan pernah mengembalikan secret.

### 5.2 Onboarding drip (`onboarding`, P0)

`POST /api/onboard/drip` body `{ "address": "0x..." }`. Tanpa auth (akun baru belum punya sesi), diamankan dengan guardrail berikut.

1. Validasi alamat.
2. Kalau alamat sudah ada di `gas_drips` dengan status `confirmed`, balas 200 `{ "status": "already_funded" }` (idempotent, bukan error).
3. Rate limit per IP (`DRIP_RATE_LIMIT_PER_HOUR`, default 5) dan batas global harian (`DRIP_DAILY_CAP`, default 200). Kalau lewat batas, balas 429 dengan code `DRIP_LIMIT_REACHED`.
4. Kalau saldo MON alamat sudah `>= DRIP_MIN_BALANCE_MON`, balas 200 `{ "status": "sufficient_balance" }` tanpa mengirim.
5. Klaim dulu dengan `INSERT` ke `gas_drips` (unique pada `address`, status `pending`) untuk mencegah race. Kirim `DRIP_AMOUNT_MON` dari wallet drip lewat mutex per wallet, tunggu receipt (timeout 20 detik). Kalau sukses, isi `tx_hash`, status `confirmed`. Kalau gagal, hapus klaim supaya bisa dicoba lagi.
6. Balas `{ "status": "funded", "txHash": "0x..." }` **hanya setelah transaksi terkonfirmasi**, supaya transaksi pertama user (join + setor) tidak gagal karena saldo belum masuk.

### 5.3 Settle scheduler (`settle`, P0)

Ini fitur inti (FR-11). Kontrak tidak bisa berjalan sendiri, jadi backend memanggil `settle(groupId)` setelah `endsAt + disputeWindow`.

- `startSettleScheduler(deps)` dipanggil dari `index.ts`. Pakai `setInterval` dengan `SETTLE_INTERVAL_MS` (default 30000), tick pertama 5 detik setelah boot. Ada guard `isRunning` supaya tick tidak pernah tumpang tindih. Deploy diasumsikan **satu replica**; kalau ada dua, hasil tetap aman karena idempotent (hanya boros gas).
- Ekspor `runSettleSweep(deps)` agar bisa dites. Langkahnya:
  1. `now` = timestamp **blok terbaru dari chain** (kontrak memakai `block.timestamp`, jangan pakai jam server). Kalau RPC gagal, lewati tick dan catat error.
  2. Ambil kandidat dari Envio: grup `status = Active` dan `endsAt <= now`, dengan paginasi. Kalau Envio gagal, catat error, jangan crash, tunggu tick berikutnya.
  3. Lewati kandidat yang `next_attempt_at` di `settle_runs`-nya masih di masa depan.
  4. Untuk tiap kandidat (berurutan, satu per satu karena nonce): baca `getGroup` di kontrak. Kalau status bukan Active, tandai `skipped`. Kalau `now < endsAt + disputeWindow`, lewati (belum waktunya). Catatan: entitas `Group` di draf Envio **tidak punya `disputeWindow`**, jadi nilainya harus dibaca dari kontrak.
  5. `simulateContract` untuk `settle`. Kalau revert karena sudah settled, tandai `skipped` (anggota boleh memanggil `settle` sebagai cadangan). Kalau revert karena sebab lain, catat `failed` dengan backoff.
  6. Kirim transaksi lewat wallet settler dengan mutex. Monad menagih gas berdasarkan gas limit, jadi pakai estimasi dengan buffer kecil (sekitar 20%), jangan berlebihan. Tunggu receipt, lalu tandai `confirmed` dan simpan `tx_hash`. Kalau receipt reverted, tandai `failed` dengan backoff.
  7. Simpan hasil ke `settle_runs` (satu baris per grup, upsert) dan log terstruktur `{ groupId, txHash, durationMs, status }`.
- Backoff: `30s * 2^attempts`, maksimal 10 menit. Setelah `SETTLE_ALERT_ATTEMPTS` (default 8), log level `error` dengan `alert: true`, tapi tetap mencoba.
- Admin, dengan header `x-admin-key`:
  - `POST /api/admin/settle/:groupId`: jalankan logika langkah 4 sampai 7 untuk satu grup sekarang juga (abaikan backoff). Ini jaring pengaman saat demo. Balas hasilnya.
  - `GET /api/admin/settle`: 50 baris `settle_runs` terbaru.

### 5.4 Auth (`auth`)

Login tanpa password. Akun Mera adalah EOA, jadi cukup verifikasi signature biasa (tidak perlu ERC-1271). Dipakai untuk endpoint yang dilindungi (profil, struk, kunci, push).

- `POST /api/auth/challenge` body `{ address }` membuat nonce acak sekali pakai (berlaku 5 menit, disimpan di `auth_nonces`) dan mengembalikan `{ message, nonce, expiresAt }`. Pakai format SIWE (EIP-4361) lewat `viem/siwe` kalau tersedia di versi viem yang dipakai. Kalau tidak, buat format pesan sederhana yang memuat domain (`AUTH_DOMAIN`), address, `chainId`, nonce, dan waktu.
- `POST /api/auth/verify` body `{ address, signature }`. Verifikasi signature, cek nonce belum dipakai dan belum kedaluwarsa, tandai nonce terpakai, lalu kembalikan `{ token, expiresAt }`. Token JWT HS256 (`AUTH_JWT_SECRET`), `sub` = address, TTL `AUTH_TOKEN_TTL_SECONDS` (default 3600).
- Middleware `requireAuth` mengisi `req.auth.address`. Middleware `requireGroupMember(groupIdFrom)` membaca `membersOf` **langsung dari kontrak** (cache memori 15 detik; kalau alamat tidak ada di cache, cek ulang on-chain supaya anggota yang baru bergabung tidak ditolak karena Envio belum menyusul).
- Bersihkan `auth_nonces` kedaluwarsa tiap jam (`setInterval`).

### 5.5 Profiles (`profiles`, P1)

- `PUT /api/profiles/me` (auth): `{ displayName (1 sampai 40 karakter, trim, tanpa karakter kontrol), avatar? (string maks. 32 karakter, emoji atau kunci preset) }`. Tidak menerima URL gambar (menghindari hosting dan penyalahgunaan).
- `GET /api/profiles/me` (auth).
- `GET /api/profiles?addresses=0x..,0x..` (publik, maksimal 20 alamat, kena rate limit): dipakai layar link undangan yang menampilkan nama pengundang dan anggota sebelum user bergabung. Kembalikan hanya alamat yang punya profil. Catat di README bahwa nama tampilan bersifat publik.

### 5.6 Receipts (`receipts`, P2, di belakang `FEATURE_RECEIPTS`)

Backend hanya menyimpan **ciphertext**. Enkripsi dan dekripsi terjadi di perangkat. Alurnya:

1. `POST /api/receipts/upload-url` (auth + anggota grup): `{ groupId, sizeBytes }`. Tolak kalau `sizeBytes > RECEIPT_MAX_BYTES` (default 5 MB). Buat baris `receipts` status `pending` dengan `storage_key = receipts/{groupId}/{uuid}`. Kembalikan presigned PUT URL (berlaku 5 menit, tetapkan `Content-Type: application/octet-stream` dan batasi ukuran sebisanya) beserta `{ receiptId, uploadUrl, headers, expiresInSeconds }`.
2. `POST /api/receipts/:id/confirm` (auth, hanya pengunggah): `{ noteHash }`. `HeadObject` harus ada dan ukurannya cocok, dan objek tidak boleh melebihi batas (kalau melebihi, hapus). Kalau `RECEIPT_VERIFY_HASH=true` (default), unduh objek dan pastikan `keccak256(bytes) === noteHash` (ASSUMPTION: `noteHash` = keccak256 dari ciphertext; sesuaikan dengan frontend). Lalu status jadi `ready`.
3. `GET /api/receipts/by-hash/:noteHash` (auth): cari receipt `ready`, cek pemanggil anggota grup pemilik receipt, kembalikan `{ receiptId, groupId, sizeBytes, downloadUrl }` (presigned GET 5 menit). Frontend memakai `noteHash` dari data pemakaian di Envio.
4. `GET /api/groups/:groupId/receipts` (auth + anggota): daftar metadata receipt `ready` tanpa URL.
5. Bersihkan receipt `pending` yang lebih dari 1 jam (hapus objek dan baris) lewat `setInterval` per jam.

Storage memakai S3 client dengan `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, jadi cocok untuk Neon Object Storage, Cloudflare R2, atau S3. Di README, jelaskan bahwa bucket perlu CORS supaya browser bisa PUT ke presigned URL.

### 5.7 Kunci enkripsi grup (`keys`, P2, di belakang `FEATURE_RECEIPTS`)

Usulan desain dari dokumen (bagian "Enkripsi struk"). Backend hanya menyimpan blob yang sudah terenkripsi dan tidak pernah melihat kunci grup.

- `PUT /api/keys/me` (auth): `{ encPublicKey }` (string, maks. 200 karakter), upsert di `member_enc_keys`.
- `GET /api/groups/:groupId/keys` (auth + anggota): `[{ address, encPublicKey | null }]` untuk semua anggota grup (dari `membersOf`).
- `PUT /api/groups/:groupId/key-wraps` (auth + anggota): `{ wraps: [{ member, wrappedKey }] }` (maks. 10). Setiap `member` harus anggota grup di kontrak. **Insert-only** (`ON CONFLICT DO NOTHING`, tidak boleh menimpa), simpan `wrapped_by`. Balas jumlah baris yang dibuat.
- `GET /api/groups/:groupId/key-wraps/me` (auth + anggota): `{ wrappedKey, wrappedBy }` atau 404 `KEY_WRAP_NOT_FOUND`.

### 5.8 Push & webhook (`push`, `webhooks`, P3, di belakang `FEATURE_PUSH`)

- `GET /api/push/vapid-public-key` (publik).
- `POST /api/push/subscribe` (auth): `{ endpoint, keys: { p256dh, auth } }`, upsert berdasarkan `endpoint`.
- `DELETE /api/push/subscribe` (auth): `{ endpoint }`.
- `POST /api/webhooks/alchemy`: pasang `express.raw` khusus route ini (sebelum `express.json`). Verifikasi HMAC-SHA256 dari raw body memakai `ALCHEMY_WEBHOOK_SIGNING_KEY` terhadap header `x-alchemy-signature` dengan `timingSafeEqual`. Balas 200 secepatnya, proses setelahnya. Ekstrak log dengan fungsi `extractLogs(payload)` yang terisolasi (ASSUMPTION: webhook tipe custom/GraphQL dengan `event.data.block.logs[]` berisi `topics`, `data`, `index`, `transaction.hash`; verifikasi dengan payload nyata dan sediakan fixture untuk test). Filter hanya log dari `GROUP_VAULT_ADDRESS`, decode dengan `decodeEventLog`, dan dedupe lewat `processed_events (tx_hash, log_index)` karena Alchemy bisa mengirim ulang.
- **Opsional, kerjakan hanya kalau semua fase lain selesai:** `NOTIFY_SOURCE=envio` sebagai pengganti webhook, yaitu poller yang membaca tabel `Activity` di Envio sejak cursor terakhir (cursor disimpan di `kv_state`). Ini jaga-jaga kalau webhook Alchemy untuk Monad testnet tidak tersedia.

Aturan notifikasi (bahasa Indonesia, nominal dari AUSD 6 desimal ditulis `$12.50`, nama dari `profiles`, fallback "Seorang anggota"; nama grup dari `getGroup`):

| Event | Penerima | Isi |
| --- | --- | --- |
| `SpendRequested` | Semua anggota kecuali pemakai | "Butuh persetujuanmu: {nama} ingin memakai $X dari kas {grup}." |
| `SpendExecuted` | Peserta (`participants`) kecuali pemakai | "Pemakaian baru $X di {grup}. Bagianmu $Y." |
| `SpendRejected` | Pemakai (dari `getSpend`) | "Pemakaianmu di {grup} ditolak." |
| `ShareDisputed` | Pemakai (dari `getSpend`) | "{nama} menolak bagiannya sebesar $Y di {grup}." |
| `Settled` | Semua anggota | "Settle-up {grup} sudah selesai. Lihat hasilnya." |
| `Pulled` | Anggota terkait | "Kekuranganmu $X di {grup} sudah diselesaikan." Kalau `remainingDebt > 0`: tambahkan "Masih ada tagihan $Z." |
| `Refunded` | Anggota terkait | "Kamu menerima $X dari kas {grup}." |

Event lain (`GroupCreated`, `MemberJoined`, `Deposited`, `DebtPaid`) tidak memicu push. Kirim lewat `web-push` (VAPID, TTL 1 jam, concurrency terbatas). Hapus langganan yang dibalas 404 atau 410. Payload kecil: `{ title, body, url: "/groups/{id}", tag }`.

## 6. Kontrak yang dipakai backend

Sumber kebenaran ABI adalah hasil compile Foundry / `packages/shared`. Daftar ini untuk kerangka awal. Bentuk return fungsi view adalah **asumsi** dan harus disesuaikan dengan kontrak sebenarnya.

```ts
export const groupVaultAbi = parseAbi([
  // views (return shapes are ASSUMPTIONS)
  'function getGroup(uint256 groupId) view returns (string name, address creator, bytes32 inviteHash, uint64 endsAt, uint64 disputeWindow, uint256 approvalThreshold, uint256 pool, uint8 status)',
  'function membersOf(uint256 groupId) view returns (address[])',
  'function getSpend(uint256 groupId, uint256 spendId) view returns (address spender, address to, uint256 amount, uint64 executedAt, uint8 status, bytes32 noteHash)',
  // write
  'function settle(uint256 groupId)',
  // events
  'event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold)',
  'event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap)',
  'event Deposited(uint256 indexed groupId, address indexed member, uint256 amount)',
  'event SpendRequested(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount)',
  'event SpendExecuted(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash)',
  'event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by)',
  'event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share)',
  'event Settled(uint256 indexed groupId, uint256 poolBefore)',
  'event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt)',
  'event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit)',
  'event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount)',
]);
```

Enum: `GroupStatus { Active = 0, Settled = 1 }`, `SpendStatus { Pending = 0, Executed = 1, Rejected = 2 }`. AUSD memakai 6 desimal (buat helper `formatAusd`). Jaringan: Monad testnet, chain ID 10143.

Query Envio (HyperIndex, gaya Hasura) untuk scheduler, isolasi di `integrations/envio.ts` dan tandai `// ASSUMPTION: verify against actual schema.graphql` untuk nama field dan tipe:

```graphql
query DueGroups($now: numeric!, $limit: Int!, $offset: Int!) {
  Group(where: { status: { _eq: "Active" }, endsAt: { _lte: $now } },
        order_by: { endsAt: asc }, limit: $limit, offset: $offset) {
    id
    endsAt
    status
  }
}
```

## 7. Database (Drizzle + Neon)

Semua alamat disimpan lowercase. `group_id` bertipe `bigint`. Aplikasi memakai connection string **pooled** (`DATABASE_URL`), migrasi memakai koneksi **direct** (`DATABASE_URL_UNPOOLED`).

| Tabel | Kolom utama |
| --- | --- |
| `gas_drips` | `address` (PK), `status` (pending, confirmed), `tx_hash`, `amount_wei`, `created_at` |
| `settle_runs` | `group_id` (PK), `status` (submitted, confirmed, failed, skipped), `tx_hash`, `attempts`, `next_attempt_at`, `last_error`, `updated_at` |
| `auth_nonces` | `nonce` (PK), `address`, `expires_at`, `used_at` |
| `profiles` | `address` (PK), `display_name`, `avatar`, `updated_at` |
| `receipts` | `id` (uuid, PK), `group_id`, `uploader_address`, `storage_key` (unique), `note_hash`, `size_bytes`, `status` (pending, ready), `created_at` |
| `member_enc_keys` | `address` (PK), `enc_public_key`, `updated_at` |
| `group_key_wraps` | `group_id`, `member_address`, `wrapped_key`, `wrapped_by`, `created_at`, PK (`group_id`, `member_address`) |
| `push_subscriptions` | `id`, `address`, `endpoint` (unique), `p256dh`, `auth`, `created_at` |
| `processed_events` | `tx_hash`, `log_index`, `created_at`, PK (`tx_hash`, `log_index`) |
| `kv_state` | `key` (PK), `value` (untuk cursor poller dan statistik kecil) |

Buat migrasi awal, script `pnpm db:generate` dan `pnpm db:migrate`, dan jalankan migrasi sebagai pre-deploy command (bukan otomatis di tiap start).

## 8. Environment variables (`.env.example`, tanpa nilai rahasia)

```
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://app.example.com
ADMIN_API_KEY=

# chain
CHAIN_ID=10143
MONAD_TESTNET_RPC_URL=
GROUP_VAULT_ADDRESS=
AUSD_ADDRESS=
ENVIO_GRAPHQL_URL=

# wallets (harus berbeda)
DRIP_PRIVATE_KEY=
SETTLER_PRIVATE_KEY=
LOW_BALANCE_THRESHOLD_MON=0.5

# drip
DRIP_AMOUNT_MON=0.05
DRIP_MIN_BALANCE_MON=0.01
DRIP_RATE_LIMIT_PER_HOUR=5
DRIP_DAILY_CAP=200

# settle scheduler
SETTLE_INTERVAL_MS=30000
SETTLE_ALERT_ATTEMPTS=8

# database
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# auth
AUTH_DOMAIN=app.example.com
AUTH_JWT_SECRET=
AUTH_TOKEN_TTL_SECONDS=3600

# P2 (aktif kalau FEATURE_RECEIPTS=true)
FEATURE_RECEIPTS=false
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
RECEIPT_MAX_BYTES=5242880
RECEIPT_VERIFY_HASH=true

# P3 (aktif kalau FEATURE_PUSH=true)
FEATURE_PUSH=false
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
ALCHEMY_WEBHOOK_SIGNING_KEY=
NOTIFY_SOURCE=alchemy
```

Variabel milik fitur yang dimatikan (`FEATURE_*=false`) tidak boleh diwajibkan oleh validasi env.

## 9. Keamanan & ketahanan

- Rate limit: drip (per IP), `auth/challenge` dan `auth/verify` (per IP), `profiles` publik (per IP), upload URL (per address).
- Semua input divalidasi zod; tolak body berlebih; jangan pernah mengembalikan stack trace ke klien.
- Private key hanya dibaca di `config/env.ts` dan dipakai di `chain/wallets.ts`. Tidak pernah dilog, tidak masuk response.
- Satu mutex per wallet untuk semua pengiriman transaksi (mencegah tabrakan nonce). Wallet drip dan settler dipisah.
- Endpoint admin hanya dengan `x-admin-key` (bandingkan dengan `timingSafeEqual`).
- Job in-process (settle, cleanup) tidak boleh membuat proses crash: bungkus dengan try/catch, log error, lanjut tick berikutnya.

## 10. Testing (vitest + supertest, semua dependency eksternal di-mock)

Minimal harus ada test untuk:

- Auth: nonce sekali pakai, nonce kedaluwarsa ditolak, signature salah ditolak, token dipakai di endpoint terlindungi.
- Drip: alamat yang sama dua kali tidak mengirim dua kali, batas per IP dan harian, saldo cukup tidak dikirim, gagal kirim melepas klaim, balasan hanya setelah receipt.
- Settle sweep: memilih kandidat yang benar, melewati grup yang belum melewati `endsAt + disputeWindow`, `skipped` kalau sudah settled, backoff naik saat gagal, Envio down tidak membuat crash, tick tidak tumpang tindih, trigger admin.
- Receipts: bukan anggota ditolak, ukuran melebihi batas ditolak, `noteHash` tidak cocok ditolak, `by-hash` hanya untuk anggota grup pemilik.
- Keys: wrap tidak bisa menimpa, `member` bukan anggota ditolak.
- Webhook: signature salah ditolak, event duplikat tidak dikirim dua kali, pemetaan event ke penerima sesuai tabel notifikasi, langganan 410 dihapus.
- `formatAusd` dan normalisasi alamat.

## 11. Deliverable & urutan kerja

Kerjakan **per fase**. Jalankan `pnpm typecheck && pnpm test` sampai hijau sebelum lanjut, dan di akhir tiap fase tulis ringkasan singkat apa yang selesai dan apa yang diasumsikan.

1. **Fase 1 (P0):** foundation, health/status, drip, settle scheduler + endpoint admin, migrasi tabel terkait, Dockerfile.
2. **Fase 2 (P1):** auth, profiles.
3. **Fase 3 (P2):** receipts, keys.
4. **Fase 4 (P3):** push, webhook Alchemy (poller Envio hanya opsional).

Hasil akhir:

- Kode lengkap di `apps/api` dengan test yang lolos.
- `Dockerfile` multi-stage (Node 22 slim), user non-root, healthcheck ke `/health`.
- `README.md` di `apps/api`: cara menjalankan lokal, tabel semua endpoint dengan contoh `curl`, penjelasan env, dan langkah deploy ke Railway (satu replica, healthcheck `/health`, pre-deploy `pnpm db:migrate`, variabel env, catatan CORS bucket).
- `docs/coverage.md`: matriks FR/US ke endpoint atau alasan tidak ada di backend, daftar semua `ASSUMPTION`, dan rekomendasi untuk tim lain (mis. tambahkan `disputeWindow` ke entitas `Group` di Envio, konfirmasi definisi `noteHash`, konfirmasi bentuk return `getGroup`).

## 12. Aturan saat ragu

- Jangan mengarang detail kontrak atau skema Envio. Kalau dokumen tidak menyebutnya, pakai asumsi di prompt ini, tandai `// ASSUMPTION:` di kode, dan daftarkan di `docs/coverage.md`.
- Jangan menambah fitur di luar daftar ini. Kalau menurutmu ada flow backend yang kurang, catat di `docs/coverage.md` sebagai usulan dan jangan langsung dibangun.
- Utamakan kode yang sederhana dan mudah dibaca dibanding abstraksi berlebihan, karena ini proyek hackathon dengan deadline.

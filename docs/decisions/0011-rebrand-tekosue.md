# 0011 — Rebrand Tekosoe → Tekosue dan domain tekosue.xyz

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

Nama produk yang benar adalah **Tekosue**; repo, paket, dan UI masih memakai "Tekosoe". Domain passkey/web juga masih `tekosoe.mulalabs.biz.id` (dan sisa `tekosoe.xyz`). Spec: `.kiro/specs/tekosue-rebrand-live-web/`.

## Decision

- Semua teks UI, wordmark (`tekosue`), dokumen, dan nama paket workspace pindah ke Tekosue / `@tekosue/*` (lockfile diregenerasi).
- Domain baru **`tekosue.xyz`** untuk rpId passkey (`EXPO_PUBLIC_PASSKEY_DOMAIN`), associated domains iOS, App Links Android `/j/*`, `.well-known`, link undangan, URL verifikasi invoice, `SITE_DOMAIN` web, `CORS_ORIGINS` api, dan `scripts/check-wellknown.mjs`.
- Identifier berikut **sengaja dipertahankan** (dijaga `scripts/rebrand-guard.test.mjs`):

| Identifier | Alasan |
| --- | --- |
| `com.tekosoe.xyz`, `com.daffaradhitya.tekosoe`, skema `tekosoe://`, slug/proyek EAS `tekosoe` | Identitas native; mengganti = app baru, APK terpasang hanya mengenal skema ini |
| `tekosoe.wav`, kanal `tekosoe-chime`, `LEGACY_CHANNEL_IDS` | File suara / id kanal notifikasi di build native |
| Kunci perangkat `tekosoe_*` (profil, onboarding, tour, rahasia undangan, PRF, credential id, demo key) | Mengganti = user keluar dan rahasia undangan pembuat trip hilang |
| `ENC_KEY_MESSAGE` ("Tekosoe receipts…"), `tekosoe/trip-key-wrap/v1`, AAD `tekosoe/receipt/v1/…` | Kunci struk diturunkan dari tanda tangan atas pesan ini; mengganti = struk lama tidak bisa dibuka |
| Pernyataan SIWE `"Sign in to Tekosoe."` | Dibandingkan dengan pesan dari APK terpasang; bukan teks layar |
| `SHARE_AUDIENCE = "tekosoe:invoice-share"` | Mengganti membatalkan kode akses invoice yang sudah terbit (7 hari) |
| `tekosoe-indexer` | Nama internal HyperIndex |
| Nama file aset `tekosoe-mark*.svg`, `tekosoe-logo.svg`, repo git `sewunodetech/tekosoe`, folder repo | Di luar cakupan |
| Judul dokumen live "Tekosoe — Dokumen Produk" dan canvas "Tekosoe — Wireframe" | Nama dokumen eksternal; ganti di sumbernya dulu |
| Catatan riwayat ADR 0001–0010 dan entri lama `docs/STATUS.md` | Riwayat tidak ditulis ulang |

## Consequences

- **Passkey lama tidak bisa dipakai.** Passkey terikat ke rpId `tekosoe.mulalabs.biz.id`; app dengan rpId `tekosue.xyz` tidak menemukannya. User testnet membuat akun baru; dana testnet di alamat lama tetap on-chain tetapi tidak bisa diakses dari app.
- **Build native baru wajib** (associated domains + intent filter ikut biner): set env EAS `EXPO_PUBLIC_PASSKEY_DOMAIN=tekosue.xyz` dan `EXPO_PUBLIC_WEB_DOMAIN=tekosue.xyz`, build APK/iOS, lalu `npm run check:wellknown -- tekosue.xyz --sha256 <fingerprint EAS>`.
- DNS `tekosue.xyz` → VPS, router Traefik (lihat ADR 0012), dan `CORS_ORIGINS` produksi api harus memuat `https://tekosue.xyz`.
- Perintah workspace sekarang `-w @tekosue/<nama>`; hapus `node_modules/@tekosoe` lama lalu `npm install` di root.

## Update (6 Oct 2026): `www.tekosue.xyz`

Apex `tekosue.xyz` di Vercel me-redirect (308) ke `www.tekosue.xyz`, sedangkan passkey dan App Links butuh `/.well-known` yang menjawab 200 tanpa redirect. Domain app (rpId passkey, associated domains, App Links `/j/*`, link undangan, QR invoice, `SITE_DOMAIN`) karena itu **`www.tekosue.xyz`**. Apex tetap me-redirect ke www untuk pengunjung. Passkey terikat ke rpId `www.tekosue.xyz`; jangan pindah ke apex nanti tanpa rencana migrasi akun. Dicek dengan `npm run check:wellknown -- www.tekosue.xyz` (Digital Asset Links Google sudah menautkan fingerprint EAS).

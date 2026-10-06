# 0014 — Notifikasi dari Envio, Alchemy dikeluarkan dari scope

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

Push notification (FR-18) dirancang lewat Alchemy webhook (P3). Alchemy sudah ditandai "dropped from scope" di `docs/STATUS.md`: kompatibilitas Gas Manager dengan akun Mera tidak pernah diverifikasi, dukungan webhook untuk Monad testnet tidak pasti, dan biaya jaringan sudah ditanggung drip MON milik kita. Meski begitu, landing page masih menampilkan Alchemy di "Built with" ("Covers the network fees"), yang melanggar aturan "integrasi sponsor harus nyata di testnet".

Aturan baru ADR 0013 (utang menghalangi trip baru) butuh pengingat, dan persetujuan pembayaran butuh pemberitahuan ke anggota lain. Kode push di api (Expo Push, `push_subs`, pemetaan event → pesan) sudah ada, tetapi hanya dipicu webhook Alchemy.

## Decision

- **Alchemy dikeluarkan** dari landing page dan aset sponsor. Route webhook `/api/webhooks/alchemy` tetap ada sebagai sumber opsional (`NOTIFY_SOURCE=alchemy`), tidak dipakai secara default.
- **Sumber event = Envio** (`NOTIFY_SOURCE=envio`, default). Job `startEnvioNotifier` di api (setiap `NOTIFY_INTERVAL_MS`, default 15 detik) membaca `Activity` baru dengan kursor di `kv_state` (`notify:envio:cursor`). Saat pertama jalan, kursor diisi "sekarang" supaya riwayat tidak dikirim sebagai push. Dedupe lewat `processed_events` (txHash, logIndex).
- Webhook dan poller sama-sama memanggil `handleGroupEvent`: catat `DebtPaid` di invoice, buat invoice saat `Settled` (juga kalau anggota yang memanggil settle), lalu kirim push kalau `FEATURE_PUSH=true`. Poller tetap jalan tanpa push, jadi status invoice tetap terbarui.
- **Push yang dikirim** (bahasa Inggris seperti app, tanpa istilah kripto, link ke route app `/trip/...`):
  - `SpendRequested` → anggota lain: "Jack wants to pay $150.00 from the pot. Tap to approve." (`/trip/{id}/spend/{spendId}/approve`)
  - `SpendExecuted` → peserta lain dengan bagiannya; `SpendRejected`, `ShareDisputed` → pemakai.
  - `Settled` → semua anggota; `Pulled` → yang kurang ("You still owe $X" kalau ada sisa); `Refunded` → yang menerima.
  - **Pengingat utang** (ADR 0013): "You still owe $X from {trip}" paling sering sekali per `DEBT_REMINDER_HOURS` (default 24) per trip per anggota, mulai sehari setelah utang pertama terlihat (push settle-up sudah memberi tahu di hari yang sama).
- Nama trip diambil dari metadata api (nama dari pembuat), cadangannya nama on-chain.

## Consequences

- `FEATURE_PUSH=true` tidak lagi butuh `ALCHEMY_WEBHOOK_SIGNING_KEY`; kunci itu hanya wajib kalau `NOTIFY_SOURCE=alchemy`.
- Push butuh build native (APK/dev build). Expo Go di Android tidak mendukung push sejak SDK 53.
- Latensi push ≈ interval poll + jeda indexer (beberapa detik sampai ~20 detik). Cukup untuk persetujuan dan pengingat.
- Lebih sedikit sponsor di "Built with", tetapi semua yang tercantum benar-benar jalan di testnet.

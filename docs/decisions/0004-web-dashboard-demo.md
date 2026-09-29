# 0004 — Landing page dan dashboard web (demo, hanya-baca)

- Status: diterima
- Tanggal: 2026-09-29

## Konteks

`apps/web` awalnya hanya punya tiga tugas: file domain passkey, halaman undangan yang membuka app, dan verifikasi invoice dari QR (`apps/web/AGENTS.md`, ADR 0001). PRD dan peta layar hanya mendefinisikan layar mobile; tidak ada FR, layar, atau WP untuk landing page atau dashboard web.

Tim memutuskan web perlu landing page dan dashboard, dengan desain persis dari app dan hanya untuk ukuran layar ponsel. Saat keputusan ini dibuat:

- Kontrak `GroupVault`, indexer Envio, dan api belum ter-deploy (`STATUS.md` › Catatan deploy), jadi belum ada data nyata untuk dibaca.
- Mera baru dirancang untuk React Native (ADR 0003). Tidak ada rancangan atau spike untuk sesi passkey di browser.
- Aturan 1–3 di `AGENTS.md` root: uang hanya on-chain, tanpa custody, satu account layer (Mera), tanpa "connect wallet".

## Keputusan

1. **Dashboard web adalah pratinjau hanya-baca dengan data demo**, tanpa login. Datanya sama dengan demo `apps/mobile` (cerita Rina/Wei/Jack di Jepang) dan diberi label "Demo preview" di layar.
2. **Semua aksi uang** (Add money, Pay, Join, Pay invoice, New trip) tidak dijalankan di web. Tombolnya membuka bottom sheet "Do this in the Tekosoe app" dengan deep link `tekosoe://…` dan tautan "Get the app".
3. **Mobile-only.** Semua halaman hidup di satu kolom maksimal 430px. Di layar lebar kolom itu tampil sebagai bingkai ponsel di tengah, bukan halaman desktop.
4. **Desain mengikuti app.** Token (`apps/mobile/src/constants/theme.ts`), ikon, maskot Teko (10 ekspresi), dan komponen dasar dipindahkan apa adanya ke `apps/web`. Hanya mode terang, copy dalam bahasa Inggris seperti app, dan larangan istilah kripto berlaku di semua halaman (dijaga oleh `npm test -w @tekosoe/web`).
5. **Lapisan data lewat `TripRepository`** (`apps/web/src/data/repo.ts`). Halaman tidak meng-import data demo langsung. Sumber live (saldo/aktivitas dari Envio, label dari `apps/api`) ditambahkan sebagai implementasi kedua dengan antarmuka yang sama setelah Envio dan kontrak ter-deploy.
6. **Tetap statis.** Semua halaman di-prerender (`generateStaticParams`), sehingga "Next.js statis di Vercel" dari ADR 0001 tetap berlaku. State yang di app memakai query string (`?state=empty`, `?who=`) dijadikan rute (`/trips/[id]/empty`, `/trips/[id]/invoice/[who]`).
7. **QR invoice memakai QR asli** (paket `qrcode`, dibuat di server) yang membuka `https://tekosoe.xyz/v/<nomor>`.
8. **`/v/[number]` belum memverifikasi apa pun.** Halaman ini menampilkan invoice demo dengan label "Demo data" dan catatan bahwa verifikasi nyata (WP W-3) akan menghitung ulang invoice dari data trip dan mencocokkannya dengan sidik jari invoice dari api. Halaman ini tidak boleh menampilkan status "terverifikasi" sebelum W-3 selesai.

## Konsekuensi

- Login passkey di web, daftar trip milik user sungguhan, dan aksi yang menandatangani uang **tidak** termasuk. Kalau nanti dibutuhkan, itu butuh spike Mera untuk browser dan ADR baru.
- Fixture demo disalin ke `apps/web/src/data/demo.ts` supaya tidak menyentuh `apps/mobile`. Ini utang: ekstrak ke `packages/shared` agar mobile dan web memakai satu sumber.
- Token desain diduplikasi di `apps/web/src/app/globals.css`. Kalau `theme.ts` berubah, ubah keduanya.
- Tombol "Get the app" mengarah ke bagian `#get-app` di landing sampai ada halaman toko; atur `NEXT_PUBLIC_APP_DOWNLOAD_URL` untuk menggantinya.
- Tidak menyentuh file `.well-known` (WP W-1). Temuan yang belum ditangani: `apple-app-site-association` masih memakai `TEAMID.com.tekosoe.app` (bundle app sebenarnya `com.tekosoe.xyz`) dan belum dilayani dengan `Content-Type: application/json`.

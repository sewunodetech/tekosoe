# 0012 — Web statis dengan shell /j dan /v yang memuat data live (W-3)

- Status: accepted (6 Oct 2026)
- Date: 2026-10-06

## Context

`/j/[code]` (undangan) dan `/v/[number]` (verifikasi invoice) di apps/web masih memakai data demo dan hanya dibangun untuk kode/nomor demo lewat `generateStaticParams`. Kode undangan (`${groupId}-${rahasia 64 hex}`) dan nomor invoice dari app tidak bisa diketahui saat build. Web juga dijalankan dengan `next start` padahal aturannya "tetap statis". Spec: `.kiro/specs/tekosue-rebrand-live-web/`.

## Decision

- **Static export nyata** (`output: "export"`). `headers()` dihapus dari `next.config.ts` (tidak didukung static export); header `.well-known` pindah ke nginx.
- **Shell statis**: `/j/[code]` dan `/v/[number]` hanya membangun satu halaman placeholder (`generateStaticParams = () => [{ code: "_" }]`, `dynamicParams = false`) → `out/j/_.html`, `out/v/_.html`. Komponen klien (`InviteView`, `VerifyView`) membaca kode/nomor dari `window.location` (lewat `useSyncExternalStore`), bukan dari `params`. Ini penyimpangan sadar dari aturan "rute dinamis memakai `generateStaticParams` per data".
- **Server**: image `apps/web/Dockerfile` (`next build` → `nginx:1.27-alpine`). `apps/web/deploy/nginx.conf` me-rewrite `/j/<apa pun>` → `/j/_.html` dan `/v/<apa pun>` → `/v/_.html` (status 200), melayani `.well-known` sebagai `application/json` tanpa redirect, dan tidak me-log path `/j` dan `/v`. Lokal: `npm run preview -w @tekosue/web` (`scripts/preview.mjs`, aturan sama dari `scripts/shell-routes.mjs`). Deploy pindah dari `next start` ke container nginx di VPS di belakang Traefik (compose VPS di luar repo):

  ```yaml
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://api.mulalabs.biz.id
        NEXT_PUBLIC_ENVIO_GRAPHQL_URL: https://graphql.mulalabs.biz.id/v1/graphql
    labels:
      - traefik.enable=true
      - traefik.http.routers.tekosue-web.rule=Host(`tekosue.xyz`)
      - traefik.http.routers.tekosue-web.entrypoints=websecure
      - traefik.http.routers.tekosue-web.tls.certresolver=<resolver yang sudah ada>
      - traefik.http.services.tekosue-web.loadbalancer.server.port=80
  ```

  Tanpa middleware redirect ke `www`. Nilai `NEXT_PUBLIC_*` ter-inline saat build: ganti URL = build ulang image.
- **Lapisan data live** `src/data/live/*` khusus `/j` dan `/v`, di samping `repo` demo untuk halaman pratinjau (penyimpangan dari aturan "data lewat `repo`"). Hanya baca, dari browser: api `GET /api/groups/:id/meta`, `GET /api/invoices/:number?token=…`, dan Envio GraphQL publik. Setiap fetch `credentials: "omit"`, `referrerPolicy: "no-referrer"`, timeout 8 detik; halaman shell memasang meta `referrer=no-referrer`. Undangan hanya mengirim `groupId`; rahasia undangan tidak pernah keluar dari browser.
- **`?token` dibaca di browser.** Kode akses invoice adalah kredensial yang dibawa link, bukan state tampilan, jadi tidak melanggar semangat aturan "jangan `searchParams` untuk state tampilan". QR, pesan share, dan link PDF membawa URL lengkap; teks yang terlihat hanya `tekosue.xyz/v/<nomor>` supaya kata "token" tidak muncul di UI. Nama parameter ada di satu konstanta bertanda `copy-guard-ignore`.
- **Verifikasi**: web membangun ulang payload invoice dari Envio dengan fungsi bersama `@tekosue/shared` (`settleOutcomeFromActivities` → `invoiceSettlementsFromOutcome` → `buildInvoicePayload` → `computeInvoiceHash`); api memakai `invoiceSettlementsFromOutcome` yang sama dari receipt RPC. "Cocok" hanya kalau payload identik, sidik jari sama, dan nomor sama; angka yang ditampilkan selalu dari data on-chain.
- **Perluasan skema Envio**: `Member.position` (urutan `membersOf`; `members[]` di kontrak hanya `push`) dan `Activity.remaining` (`remainingDebt`/`remainingCredit` dari `Pulled`/`Refunded`). Tanpa dua kolom ini payload tidak bisa direkonstruksi persis: `Member.debt/credit` adalah nilai sekarang, dan `joinedAt` tidak bisa mengurutkan dua join di blok yang sama.

## Alternatif yang ditolak

- **Receipt settle + `membersOf` lewat RPC publik dari browser.** Paling identik dengan api, tetapi melanggar "Envio = sumber baca untuk uang" dan bergantung pada rate limit RPC publik. Disimpan sebagai cadangan kalau sinkron ulang Envio gagal sebelum deadline.
- **Server Next (`next start`) dengan rute dinamis.** Bertentangan dengan aturan web statis dan menambah proses Node di VPS.

## Consequences

- **Envio wajib codegen + sinkron ulang dari `start_block`** setelah deploy indexer baru. Selama kolom baru belum ada/terisi, `/v` menampilkan "We can't check this invoice right now" (tidak pernah "cocok"). Jadwalkan di luar demo; selama sinkron ulang mobile live dan api membaca data yang belum lengkap.
- `next dev` hanya mengenal `/j/_` dan `/v/_`; uji kode/nomor nyata dengan `npm run build && npm run preview`.
- Prefetch segmen RSC (`__next.*.__PAGE__.txt`) mendapat 404 di static export versi Next ini karena file ditulis bersarang; navigasi tetap jalan.
- `CORS_ORIGINS` produksi api harus memuat `https://tekosue.xyz` (kosong = terbuka); endpoint Envio publik harus HTTPS dan mengizinkan origin itu.

## Update (6 Oct 2026): hosting di Vercel

`www.tekosue.xyz` dilayani Vercel (project root `apps/web`). Aturan nginx dicerminkan di `apps/web/vercel.json`: rewrite `/j/:code` → `/j/_` dan `/v/:number` → `/v/_` (tujuan tanpa `.html` karena build Next di Vercel menyajikan route tanpa ekstensi, dan rewrite hanya jalan kalau tujuannya ada), `Content-Type: application/json` untuk kedua file `.well-known`, dan `Referrer-Policy: no-referrer` untuk `/j` dan `/v`. Image nginx (`apps/web/Dockerfile`) tetap ada sebagai opsi hosting di VPS.

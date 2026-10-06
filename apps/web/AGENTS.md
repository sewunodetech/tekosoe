<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tekosue — web
# Tekosue — web

Lihat juga `AGENTS.md` di root dan [ADR 0004](../../docs/decisions/0004-web-dashboard-demo.md). Next.js static export (`output: "export"`), dilayani nginx di VPS (`Dockerfile`, `deploy/nginx.conf`, [ADR 0012](../../docs/decisions/0012-web-static-shell.md)) di `www.tekosue.xyz`. Dashboard **mobile-only** (satu kolom maks. 430px; di layar lebar tampil sebagai bingkai ponsel di tengah, `components/Frame.tsx` lewat route group `(phone)`). Landing `/` adalah hero putih full-bleed dan responsif (`components/landing/`: `Navbar`, `Hero`, `Sections`; gaya kaca lewat kelas `lg-*` di `globals.css`; **dua warna saja**: netral + aksen `teal`; integrasi sponsor ada di `Integrations.tsx`, ditulis "Built with", bukan "partner"; Inter, hitam/abu, Tailwind + `lucide-react`) — pengecualian yang disengaja dari tema kartun; jangan campurkan token kartun ke sana. Satu-satunya pengecualian: scene 3D kartun (three.js/R3F) di `components/landing/three/` dan latar `.lg-scene` ([ADR 0010](../../docs/decisions/0010-landing-3d.md)) — muat hanya lewat `three/lazy.tsx` (`ssr: false`), bungkus dengan `SceneCanvas`, dan jangan taruh informasi penting hanya di dalam canvas.

Tugasnya:

1. **Landing page + halaman unduh `/get-app`** (gaya landing, di luar bingkai ponsel; APK dari `NEXT_PUBLIC_ANDROID_APK_URL`) **+ dashboard pratinjau hanya-baca** dengan data demo (`/`, `/trips`, `/card`, `/profile`, …). Tanpa login, tanpa aksi uang — tombol aksi memakai `AppAction` (`components/ui/app-sheet.tsx`) yang membuka sheet "buka di app".
2. **Verifikasi invoice dari QR** (`/v/[number]`) — live (W-3): `components/verify-view.tsx` membaca nomor dari path dan kode akses dari `?token=`, membangun ulang invoice dari Envio dengan fungsi `@tekosue/shared`, lalu mencocokkan payload + sidik jari dari api. Angka yang tampil selalu dari data on-chain.
3. **Link undangan** (`/j/[code]`) yang membuka app (deep link `tekosue://`, fallback ke `/get-app`) — live: `components/invite-view.tsx` menampilkan trip nyata (api meta + Envio); hanya `groupId` yang dikirim, rahasia undangan tidak pernah keluar dari browser.
4. **File asosiasi domain untuk passkey** — `/.well-known/apple-app-site-association` dan `/.well-known/assetlinks.json` di domain yang sama dengan `EXPO_PUBLIC_PASSKEY_DOMAIN`. Tanpa ini passkey native tidak jalan.

Bukan tempat backend: penjadwal, gas, dan database ada di `apps/api`. Web tidak pernah menulis ke api/database.

## Aturan lokal

- **Desain dashboard = app** (landing punya gaya sendiri, lihat atas). Token ada di `src/app/globals.css` (`@theme`, salinan `apps/mobile/src/constants/theme.ts`); jangan tulis hex di JSX, pakai utilitas (`bg-mint`, `text-teal`, `type-h1`, `rounded-card`, …). Ikon di `components/icons.tsx`, maskot di `components/Teko.tsx` (10 mood), komponen dasar di `components/ui/`. Jangan mengubah tampilan; kalau app berubah, ikuti app. Hanya mode terang.
- **Tanpa istilah kripto** di teks yang terlihat user: wallet, gas, seed phrase, blockchain, token, hash, transaction. Dijaga oleh `npm test -w @tekosue/web` (`scripts/copy-guard.test.mjs`). Nominal selalu lewat `money()`/`signed()` (`src/lib/money.ts`, membungkus `formatDollars` dari `@tekosue/shared`).
- **Data lewat `repo`** (`src/data/repo.ts`, antarmuka `TripRepository`) untuk halaman pratinjau. Pengecualian: `/j` dan `/v` memakai lapisan live `src/data/live/*` (fetch dari browser, `credentials: "omit"`, `referrerPolicy: "no-referrer"`); komponen tidak memanggil api/Envio langsung. Halaman tidak meng-import `src/data/demo.ts` langsung. Fixture demo adalah salinan dari `apps/mobile/src/data/demo` — jaga tetap sama.
- **Tetap statis**: rute dinamis memakai `generateStaticParams`; jangan memakai `searchParams` untuk state tampilan (jadikan rute). Di Next 16 `params` adalah `Promise`. Pengecualian (ADR 0012): `/j/[code]` dan `/v/[number]` adalah shell statis (`/j/_`, `/v/_`) yang membaca path di browser; nginx dan `scripts/preview.mjs` me-rewrite semua `/j/*` `/v/*` ke sana. `?token` di `/v` adalah kredensial link, bukan state tampilan. Uji kode/nomor nyata dengan `npm run build -w @tekosue/web && npm run preview -w @tekosue/web` (`next dev` hanya kenal `/j/_`, `/v/_`). Tidak ada `headers()`/`rewrites()` (tidak didukung static export) — atur di `deploy/nginx.conf`.
- **Tes**: `npm test -w @tekosue/web` = `scripts/*.test.mjs` (copy guard, rewrite shell) + vitest/fast-check untuk `src/**/*.test.ts`. Baris yang memang harus memuat kata terlarang di kode (mis. nama parameter URL) diberi komentar `copy-guard-ignore`.
- Env publik hanya `NEXT_PUBLIC_*` (mis. `NEXT_PUBLIC_APP_DOWNLOAD_URL`). Rahasia tidak pernah di web.

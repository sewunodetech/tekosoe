<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tekosoe — web

Lihat juga `AGENTS.md` di root dan [ADR 0004](../../docs/decisions/0004-web-dashboard-demo.md). Next.js statis di Vercel. Dashboard **mobile-only** (satu kolom maks. 430px; di layar lebar tampil sebagai bingkai ponsel di tengah, `components/Frame.tsx` lewat route group `(phone)`). Landing `/` adalah hero putih full-bleed dan responsif (`components/landing/`: `Navbar`, `Hero`, `Sections`; Inter, hitam/abu, Tailwind + `lucide-react`) — pengecualian yang disengaja dari tema kartun; jangan campurkan token kartun ke sana.

Tugasnya:

1. **Landing page + dashboard pratinjau hanya-baca** dengan data demo (`/`, `/trips`, `/card`, `/profile`, …). Tanpa login, tanpa aksi uang — tombol aksi memakai `AppAction` (`components/ui/app-sheet.tsx`) yang membuka sheet "buka di app".
2. **Verifikasi invoice dari QR** (`/v/[number]`) — target: hitung ulang invoice dari data on-chain (Envio) dan cocokkan sidik jari invoice. Sekarang masih data demo (WP W-3).
3. **Link undangan** (`/j/[code]`) yang membuka app (deep link `tekosoe://`, fallback ke `/get-app`).
4. **File asosiasi domain untuk passkey** — `/.well-known/apple-app-site-association` dan `/.well-known/assetlinks.json` di domain yang sama dengan `EXPO_PUBLIC_PASSKEY_DOMAIN`. Tanpa ini passkey native tidak jalan.

Bukan tempat backend: penjadwal, gas, dan database ada di `apps/api`. Web tidak pernah menulis ke api/database.

## Aturan lokal

- **Desain dashboard = app** (landing punya gaya sendiri, lihat atas). Token ada di `src/app/globals.css` (`@theme`, salinan `apps/mobile/src/constants/theme.ts`); jangan tulis hex di JSX, pakai utilitas (`bg-mint`, `text-teal`, `type-h1`, `rounded-card`, …). Ikon di `components/icons.tsx`, maskot di `components/Teko.tsx` (10 mood), komponen dasar di `components/ui/`. Jangan mengubah tampilan; kalau app berubah, ikuti app. Hanya mode terang.
- **Tanpa istilah kripto** di teks yang terlihat user: wallet, gas, seed phrase, blockchain, token, hash, transaction. Dijaga oleh `npm test -w @tekosoe/web` (`scripts/copy-guard.test.mjs`). Nominal selalu lewat `money()`/`signed()` (`src/lib/money.ts`, membungkus `formatDollars` dari `@tekosoe/shared`).
- **Data lewat `repo`** (`src/data/repo.ts`, antarmuka `TripRepository`). Halaman tidak meng-import `src/data/demo.ts` langsung. Fixture demo adalah salinan dari `apps/mobile/src/data/demo` — jaga tetap sama.
- **Tetap statis**: rute dinamis memakai `generateStaticParams`; jangan memakai `searchParams` untuk state tampilan (jadikan rute). Di Next 16 `params` adalah `Promise`.
- Env publik hanya `NEXT_PUBLIC_*` (mis. `NEXT_PUBLIC_APP_DOWNLOAD_URL`). Rahasia tidak pernah di web.

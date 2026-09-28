<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tekosoe — halaman web kecil

Lihat juga `AGENTS.md` di root. Next.js statis di Vercel dengan tiga tugas saja:

1. **Verifikasi invoice dari QR** — hitung ulang invoice dari data on-chain (Envio) dan cocokkan `invoice_hash`.
2. **Link undangan** yang membuka app (deep link skema `tekosoe://`, fallback ke halaman unduh).
3. **File asosiasi domain untuk passkey** — `/.well-known/apple-app-site-association` dan `/.well-known/assetlinks.json` di domain yang sama dengan `EXPO_PUBLIC_PASSKEY_DOMAIN`. Tanpa ini passkey native tidak jalan.

Bukan tempat backend: penjadwal, gas, dan database ada di `apps/api`. Tidak ada istilah kripto di halaman yang dilihat user umum.

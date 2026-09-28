# 0001 — Monorepo dan stack

- Status: diterima
- Tanggal: 2026-09-28

## Konteks

Spesifikasi Teknis menetapkan satu monorepo TypeScript berisi app mobile, halaman web kecil, backend mini, kontrak, dan indexer, dengan ABI dipakai bersama.

## Keputusan

- npm workspaces + Turborepo (awalnya pnpm, diganti npm atas permintaan tim). Paket bernama `@tekosoe/*`; paket internal direferensikan dengan versi `"*"`.
- `apps/mobile`: Expo SDK 57 + Expo Router (dari template `create-expo-app` default). NativeWind ditambahkan saat mulai membangun UI.
- `apps/web`: Next.js 16 (App Router, Tailwind v4), dideploy statis ke Vercel.
- `apps/api`: Hono + `@hono/node-server`, dijalankan di Docker (Railway/Fly). Dipisah dari Next.js supaya penjadwal settle berjalan terus dan tepat waktu.
- `packages/contracts`: Foundry + OpenZeppelin (via npm, lewat `remappings.txt`).
- `packages/indexer`: Envio HyperIndex v3 (`indexer.onEvent`).
- `packages/shared`: ABI, chain, alamat, tipe, skema zod.
- Native app (Expo), bukan PWA — sudah diputuskan di BRD.

## Konsekuensi

- Setiap perubahan event/fungsi kontrak harus diikuti pembaruan ABI di `packages/shared` dan `packages/indexer/config.yaml`.
- Paket native di mobile dipasang dengan `npx expo install` agar versi cocok dengan SDK.

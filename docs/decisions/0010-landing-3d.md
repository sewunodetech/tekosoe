# 0010 — Landing: scene 3D kartun dengan three.js

- Status: accepted (5 Oct 2026)
- Date: 2026-10-05

## Context

Landing `/` (apps/web) memakai video stok di hero dan dua ilustrasi AI statis (`path.webp`, `lake.webp`). Tim ingin landing lebih hidup dan lebih "Tekosue": maskot Teko yang sama dengan di app, bukan visual generik. Aturan landing sebelumnya membatasi warna ke netral + satu aksen teal.

## Decision

- Empat section memakai scene 3D (three.js lewat `@react-three/fiber` + `@react-three/drei`), semua di `apps/web/src/components/landing/three/`:
  - **Hero** (`HeroScene`): Teko 3D, empat teman, dan koin yang bergerak sesuai tab Plan / Chip in / Spend / Settle. Menggantikan video stok.
  - **How it works** (`StepsScene` + `HowSteps`): diorama pulau dengan empat pos. Teko berjalan ke pos langkah yang aktif (otomatis bergilir, atau mengikuti kartu yang disorot).
  - **Built with** (`OrbitScene`): planet Tekosue dengan lencana logo sponsor yang mengorbit. Kartu HTML di bawahnya tetap jadi sumber isi.
  - **CTA penutup** (`TekoScene`): Teko besar yang menoleh ke kursor dan melompat + menyemburkan koin saat diklik.
- **Gaya kartun**: material toon + garis tinta (drei `Outlines`) dengan palet maskot (`three/palette.ts`). Ini pengecualian dari aturan "dua warna" landing, **hanya untuk objek 3D dan latar `.lg-scene`**. Teks, tombol, dan kartu tetap netral + teal.
- **Kinerja dan aksesibilitas**: scene dimuat dengan `next/dynamic({ ssr: false })` lewat `three/lazy.tsx`, jadi three.js hanya diunduh di `/` dan halaman tetap statis. Canvas hanya menggambar saat terlihat (IntersectionObserver), diam saat "kurangi gerakan", jatuh ke latar gradasi tanpa WebGL, dan `aria-hidden`. Semua informasi tetap ada di HTML.

## Consequences

- Dependensi baru di apps/web: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`.
- `path.webp` dan `lake.webp` dihapus. Video hero tidak dipakai lagi.
- R3F tidak menyalakan ulang loop render saat `frameloop` berganti ke "always". `SceneCanvas` memanggil `invalidate()` saat scene kembali terlihat (`KickLoop`). Jangan hapus tanpa menguji scene yang dimuat di luar layar.
- Kalau maskot di app berubah, sesuaikan `Teko3D` (`three/shapes.tsx`) dengan gambar 2D di `components/Teko.tsx`.

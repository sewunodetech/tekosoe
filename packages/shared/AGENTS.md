# packages/shared

Kode yang dipakai bersama oleh app, api, web, dan indexer. Tidak boleh bergantung pada React, React Native, atau Node-only API — harus jalan di semua runtime.

- `src/abi/groupVault.ts` — ABI GroupVault. Setiap perubahan fungsi/event di `packages/contracts` wajib diikuti di sini **dan** di `packages/indexer/config.yaml`. Setelah kontrak stabil, ganti dengan ABI hasil `forge build`.
- `src/money.ts` — AUSD 6 desimal sebagai `bigint`. UI hanya menampilkan uang lewat `formatDollars`.
- `src/metadata.ts` — skema zod metadata Supabase dan `computeNoteHash`. App menghitung `noteHash` sebelum memanggil `spend`; api menolak metadata yang hash-nya tidak cocok. Jangan ubah format JSON kanonik tanpa ADR — hash lama jadi "Unverified".
- `src/chain.ts` — Monad testnet (10143), batas 10 anggota, alamat AUSD (belum diverifikasi).

Paket ini dikonsumsi langsung sebagai source TypeScript (tanpa build step).

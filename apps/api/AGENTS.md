# apps/api — backend mini

Hono (Node/TypeScript) dalam Docker, deploy ke Railway atau Fly. Empat tugas saja (spesifikasi › Pembagian tugas):

1. **Penjadwal settle** — panggil `settle(groupId)` setelah `endsAt + disputeWindow` (`src/jobs/settleScheduler.ts`), lalu buat baris `invoices` per anggota.
2. **Gas** — drip sedikit MON ke akun baru saat onboarding, atau relayer, atau Alchemy Gas Manager (P3).
3. **Satu-satunya pintu ke database** (Postgres via `DATABASE_URL`) dan object storage struk — app tidak pernah terhubung langsung.
4. **Push notification** lewat Expo (`push_subs`).

## Aturan

- Kunci backend hanya untuk gas dan DB. **Tidak pernah** memegang dana atau kunci user.
- Setiap rute metadata: verifikasi pesan bertanda tangan EIP-191 dari alamat anggota (kunci Mera) + cek keanggotaan grup on-chain sebelum baca/tulis.
- Tolak metadata spend yang `computeNoteHash` (dari `@tekosoe/shared`) tidak sama dengan `noteHash` on-chain.
- `DATABASE_URL` dan kredensial `RECEIPTS_STORAGE_*` hanya ada di sini. Provider belum final (ADR 0002) — pilih driver setelah diputuskan.
- Kalau DB mati, uang tetap tampil dari Envio — api tidak boleh menjadi jalur wajib untuk data uang.
- Invoice: nomor `INV-{trip}-{urutan}`, `invoice_hash = keccak256(JSON kanonik)`, status `paid | refunded | due`.

## Perintah

```bash
npm run dev -w @tekosoe/api
docker build -f apps/api/Dockerfile .
```

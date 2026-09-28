# Roadmap Tekosoe (semua tim)

Gambaran besar untuk semua tim. Detail per tim:
- **Mobile** → [`apps/mobile/ROADMAP.md`](../apps/mobile/ROADMAP.md) (tim kita)
- Kontrak, indexer, api, database, web → paket kerja di bawah; aturan lokal di `AGENTS.md` masing-masing folder

Progres dicentang di [`STATUS.md`](STATUS.md). Deadline submit **12 Okt 2026** (resmi 13 Okt 23.59 ET).

## 1. Goal

**Produk v0.1:** skenario "tiga teman, tiga negara, trip Jepang" jalan **end-to-end di Monad testnet dengan AUSD asli**, tanpa langkah manual di belakang layar:
onboarding Face ID → buat trip + undang → gabung + setor + safety net → bayar dari pot (di atas batas butuh approval) → keberatan → settle-up otomatis di tanggal akhir → invoice per anggota.

**Kompetisi:** masuk 3 besar track Consumer Products & Payments dan menang bounty Agora. Bounty pendukung sesuai prioritas: Mera UX, Envio, Mera PRF, Alchemy.

**Definisi selesai v0.1** (PRD › Kriteria rilis):
- FR-01 sampai FR-13 jalan di testnet, termasuk settle-up otomatis.
- Unit + fuzz test kontrak lolos; Slither tanpa temuan serius.
- Tidak ada istilah kripto di layar user.
- README, video demo, dan profil project lengkap.

## 2. Scope

| Lapisan | Isi | Bounty |
| --- | --- | --- |
| **P0** | Kontrak GroupVault lengkap · onboarding Mera + gas tanpa MON · grup/undang/gabung/setor · spend + approval + keberatan · settle otomatis + tagihan · metadata lewat api · struk terenkripsi + `attachReceipt` · invoice in-app | Track, Agora, Mera UX |
| **P1** | Indexer Envio untuk 12 event · feed real-time · saldo & perkiraan settle dari indexer | Envio |
| **P2** | Kartu simulasi · kunci enkripsi turunan PRF + kunci grup | Mera PRF |
| **P3** | Alchemy Gas Manager (maks. ½ hari) · Webhooks → push | Alchemy |

**Di luar scope:** approval untuk setiap spend · mainnet · token selain AUSD · kartu sungguhan · on/off-ramp fiat.

**Aturan potong:** fase molor lebih dari 1 hari → potong P3, lalu P2. P0 tidak pernah dipotong. Lapisan berikutnya baru dimulai setelah lapisan sebelumnya jalan end-to-end di testnet.

## 3. Fase & paket kerja

| Fase | Tanggal | Tim | Paket kerja | Selesai kalau |
| --- | --- | --- | --- | --- |
| **0 Spike risiko** | 28–29 Sep | semua | Mera di React Native (dikerjakan mobile, WP M2) · alamat & faucet AUSD · pilihan gas (drip MON / relayer / Alchemy, ADR 0003) · provider DB (ADR 0002) | 1 transaksi AUSD dari akun Mera tanpa MON milik user; ADR 0002 & 0003 diterima |
| **1 Kontrak** | 28 Sep – 2 Okt | kontrak | **C-1** grup & setoran · **C-2** spend & approval · **C-3** keberatan & struk · **C-4** settle & utang · **C-5** fuzz/invariant + reentrancy + Slither · **C-6** deploy testnet + ABI final ke `packages/shared` | Contoh A/B/C spesifikasi tepat; invariant saldo lolos; alamat di `STATUS.md` |
| **2 Data** | 30 Sep – 3 Okt | indexer, backend | **D-1** indexer 12 event · **D-2** api metadata + auth EIP-191 + validasi `noteHash` · **D-3** drip gas · **D-4** penjadwal settle + tabel invoices | `Member.net` di indexer = `balanceOf` di kontrak; grup uji ter-settle otomatis |
| **3 Mobile** | 28 Sep – 11 Okt | mobile | M0–M11, lihat [`apps/mobile/ROADMAP.md`](../apps/mobile/ROADMAP.md) | Jalur demo juri jalan di mode live di 3 HP |
| **4 Web** | 3–8 Okt | web | **W-1** `.well-known` passkey (apple-app-site-association, assetlinks.json) · **W-2** halaman undangan yang membuka app · **W-3** verifikasi invoice dari QR | Passkey native jalan di domain; link undangan membuka app |
| **5 Uji & submit** | 9–12 Okt | semua | **Q-1** E2E 3 HP di testnet · **Q-2** uji UX non-kripto · **Q-3** build EAS · **Q-4** README (alamat, hash, bagian per sponsor, pengungkapan AI), video ≤ 3 menit, profil project | Checklist submission di `07-rencana-pengembangan.md` lengkap |

## 4. Dependensi & serah-terima antar tim

```
C-1..C-5 ─> C-6 deploy + ABI ─┬─> D-1 indexer ─┐
                              └─> D-2 api ─────┼─> Mobile M6 (data live)
Spike Mera (M2) ─> gas (D-3) ─> Mobile M3/M4   │
C-4 + D-1 + D-2 ─> D-4 penjadwal settle ───────┴─> Mobile M8 (invoice)
W-1 .well-known ─> Mobile M3 (passkey) & M9 (deep link)
```

Titik serah-terima dicatat di `STATUS.md` › Catatan deploy, dan diumumkan ke tim mobile:

| Serah-terima | Dari | Ke |
| --- | --- | --- |
| Alamat `GroupVault` + ABI final di `packages/shared/src/abi/groupVault.ts` | kontrak | indexer, api, mobile |
| URL GraphQL Envio + skema entitas | indexer | mobile |
| URL api + tipe request/response di `packages/shared` | backend | mobile |
| Domain passkey + file `.well-known` | web | mobile |

Kebutuhan data mobile yang rinci ada di [`apps/mobile/ROADMAP.md`](../apps/mobile/ROADMAP.md) › bagian 4.

## 5. Risiko utama

| Risiko | Jalan keluar |
| --- | --- |
| Mera / PRF tidak jalan di React Native | Diputuskan di spike hari pertama; cadangan: langkah Mera di in-app browser dengan domain yang sama |
| Alchemy Gas Manager tidak cocok dengan EOA Mera | Batas ½ hari, lalu drip MON atau relayer sendiri |
| Faucet AUSD testnet terbatas | Tanya tim Agora di Discord sejak hari pertama |
| Backend terlambat | Mobile jalan di mode demo; integrasi live dikejar 3–6 Okt |
| Waktu habis | Potong P3, lalu P2; P0 tidak pernah dipotong |

# 0007 — Layar Activity (pengganti Notifications) dan Top up / Cash out di Envio

- Status: diterima (user, 2 Okt 2026)
- Tanggal: 2026-10-02

## Konteks

Lonceng di 03 Home membuka layar "Notifications" yang selalu kosong: notifikasi hanya berupa banner sesaat di app dan push OS (FR-18), tidak pernah disimpan. User ingin halaman itu berisi riwayat: top up, mengisi pot, pembayaran, settle-up, dll. Event trip sudah ada di Envio (`Activity`), tapi Top up / Cash out (ADR 0006) hanya transfer AUSD biasa yang belum diindeks. Top up testnet juga "kotor" on-chain: faucet selalu mengirim 10.000 lalu app mengembalikan kelebihannya — sebelumnya ke alamat "bank" yang sama dengan Cash out (dan toko demo), jadi tidak bisa dibedakan.

## Keputusan

- Route `/notifications` diganti **`/activity`**, judul **"Activity"**, tetap dibuka dari lonceng Home. Isi: bagian **"Needs you"** (permintaan bayar teman yang menunggu persetujuanmu → 10 Approval) lalu riwayat per hari. Titik di lonceng hanya muncul kalau ada "Needs you".
- Sumber data **hanya Envio** (uang on-chain, aturan 1): event GroupVault dari `Activity` + entitas baru **`BalanceActivity`** (TopUp / CashOut) dari `Transfer` AUSD dengan filter `where` (from = faucet, to = faucet, to = bank Cash out). Label (nama, judul) tetap dari api.
- App mengembalikan kelebihan faucet **ke faucet**, bukan ke "bank", supaya: faucet → user = Top up, user → faucet = pengurang Top up terakhir, user → bank = Cash out. Transfer GroupVault → toko demo (pembayaran pot) diabaikan.
- Riwayat versi lama (pengembalian ke "bank"): transfer user → bank ≤ 5 menit setelah Top up yang belum dikurangi dianggap pengembalian.

## Konsekuensi

- Indexer perlu `envio codegen` + redeploy (re-sync dari `start_block`). Sampai itu terjadi app tetap jalan: baris Top up / Cash out dilewati.
- Kasus tepi lama: Top up tepat $10.000 lalu Cash out sungguhan dalam 5 menit akan terbaca sebagai pengembalian.
- Layar di luar Final UI; desainnya memakai pola baris aktivitas F07 (kartu putih, ubin ikon / avatar). Kalau nanti push disimpan, tetap tampil di layar ini.

# Tekosoe — User Stories & Acceptance Criteria

Setiap story selesai kalau semua acceptance criteria-nya lolos di Monad testnet. Nomor FR merujuk ke tab PRD.

## Epic 1 — Onboarding (P0)

**US-01. Sebagai pengguna baru, saya ingin membuat akun dengan Face ID, supaya saya tidak perlu mengurus seed phrase.** (FR-01, FR-03)

- [ ] Akun jadi setelah satu kali prompt passkey
- [ ] Tidak ada layar seed phrase, extension, atau permintaan membeli token gas
- [ ] Transaksi pertama berhasil walaupun akun tidak punya MON

**US-02. Sebagai pengguna, saya ingin masuk di ponsel lain dan melihat akun yang sama.** (FR-02)

- [ ] Passkey yang sama di perangkat kedua menghasilkan alamat yang sama
- [ ] Grup dan saldo yang sama tampil di perangkat kedua

## Epic 2 — Grup (P0)

**US-03. Sebagai pembuat grup, saya ingin membuat grup dengan tanggal berakhir dan membagikan link undangan.** (FR-04, FR-05)

- [ ] Grup dibuat dengan nama, tanggal berakhir, dan batas persetujuan
- [ ] Tanggal berakhir harus di masa depan
- [ ] Link undangan bisa dibagikan lewat aplikasi chat

**US-04. Sebagai teman yang diundang, saya ingin bergabung dengan Face ID dan langsung menyetor dana.** (FR-05, FR-06)

- [ ] Dari link sampai jadi anggota hanya dengan passkey
- [ ] Saya memilih batas jaminan, dijelaskan sebagai "jaminan maksimal kalau kamu kurang bayar di akhir trip"
- [ ] Link dengan rahasia yang salah ditolak; grup maksimal 10 anggota

## Epic 3 — Kas bersama (P0)

**US-05. Sebagai anggota, saya ingin menyetor atau menambah dana ke kas kapan saja sebelum grup berakhir.** (FR-06, FR-13)

- [ ] Setoran masuk ke kas dan tercatat sebagai setoran saya
- [ ] Nominal tampil dalam dolar tanpa istilah kripto

**US-06. Sebagai anggota, saya ingin memakai kas walaupun setoran saya sudah terpakai, selama kas masih ada.** (FR-07, FR-08)

- [ ] Pemakaian berhasil selama nominal tidak melebihi isi kas, apa pun setoran saya
- [ ] Pemakaian ditolak kalau kas tidak cukup, dan app menawarkan "Tambah dana"
- [ ] Saya memilih untuk siapa: default semua anggota, bisa sebagian (misalnya A dan C saja), bagi rata atau manual
- [ ] Total pembagian harus sama dengan nominal
- [ ] Pemakaian tercatat otomatis di kontrak; tidak ada langkah pencatatan terpisah

**US-07. Sebagai anggota, saya ingin pemakaian besar disetujui anggota lain, supaya kas aman.** (FR-09)

- [ ] Pemakaian di atas batas grup menunggu persetujuan
- [ ] Satu anggota selain pemakai bisa menyetujui atau menolak
- [ ] Pemakaian yang disetujui langsung dibayar; yang ditolak tidak mengubah kas

**US-08. Sebagai anggota yang tidak ikut, saya ingin menolak bagian saya dari suatu pemakaian.** (FR-10)

- [ ] Tombol tolak hanya tersedia bagi peserta, selama jendela keberatan
- [ ] Bagian saya pindah ke pemakai, dan saldo kami berdua berubah sesuai

## Epic 4 — Settle-up otomatis (P0)

**US-09. Sebagai anggota, saya ingin semua saldo selesai otomatis di tanggal grup berakhir tanpa saya melakukan apa pun.** (FR-11)

- [ ] Settle-up berjalan otomatis setelah tanggal berakhir dan jendela keberatan terakhir
- [ ] Yang lebih bayar menerima kelebihannya langsung ke akunnya
- [ ] Yang kurang bayar ditarik otomatis sampai batas jaminannya
- [ ] Hasil akhir sama dengan hitungan manual (lihat contoh A, B, C di Spesifikasi Teknis)

**US-10. Sebagai anggota yang kurang bayar melebihi batas jaminan, saya ingin melihat dan melunasi tagihan saya.** (FR-12)

- [ ] Tagihan menampilkan nominal dan kepada siapa uang itu akan dibagikan
- [ ] Pelunasan langsung dibagikan ke anggota yang masih punya hak

## Epic 5 — Aktivitas real-time (P1)

**US-11. Sebagai anggota, saya ingin melihat aktivitas dan perkiraan hasil settle-up tanpa refresh.** (FR-14, FR-15)

- [ ] Setoran, pemakaian, persetujuan, dan penolakan muncul di feed semua anggota
- [ ] Saldo tiap anggota (setor, pakai, saldo bersih) sama dengan data kontrak

## Epic 6 — Kartu simulasi (P2)

**US-12. Sebagai anggota, saya ingin membayar di toko langsung dari kas dengan kartu Tekosoe.** (FR-16)

- [ ] Pembayaran ke toko demo memotong kas secara nyata di testnet
- [ ] Saya tetap memilih untuk siapa pembayaran itu
- [ ] Layar kartu menampilkan label "Kartu (simulasi)" dan tidak memakai logo Visa

## Epic 7 — Privasi (P2)

**US-13. Sebagai anggota, saya ingin catatan dan struk tidak bisa dibaca orang luar.** (FR-17)

- [ ] On-chain hanya menyimpan hash atau ciphertext
- [ ] Anggota grup bisa membuka catatan; alamat di luar grup tidak bisa

## Epic 8 — Notifikasi (P3)

**US-14. Sebagai anggota, saya ingin diberi tahu saat ada pemakaian baru, permintaan persetujuan, dan hasil settle-up.** (FR-18)

- [ ] Notifikasi terkirim ke anggota yang terlibat

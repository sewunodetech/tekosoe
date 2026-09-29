# Tekosoe — User Flow

App punya dua flow utama: masuk dan bergabung ke grup (termasuk setor dana dan memilih batas jaminan), lalu memakai kas bersama sampai tanggal grup berakhir, saat settle-up berjalan otomatis. Daftar layar di bagian akhir menjadi dasar wireframe.

## Flow 1 — Masuk dan bergabung ke grup

Ada dua pintu masuk, dan keduanya melewati layar Face ID yang sama: membuka app langsung, atau membuka link undangan dari teman. Akun baru langsung mengisi profil (nama, kota, negara, warna avatar) di layar P1 tepat setelah passkey dibuat, lalu masuk Home atau lanjut ke layar gabung.

&#91;embedded content: flow masuk dan bergabung · 7 layar\]

User yang datang lewat link tidak melewati Beranda; setelah Face ID ia langsung melihat konfirmasi gabung, memilih batas jaminan, dan menyetor dana awal dalam satu layar. Ini jalur tercepat dan paling penting untuk demo.

## Flow 2 — Di dalam grup

Detail grup adalah pusat app. Siapa pun bisa memakai kas selama isinya cukup; setiap pemakaian langsung tercatat di kontrak, dan pemakaian di atas batas grup menunggu persetujuan satu anggota lain.

&#91;embedded content: flow di dalam grup · 9 layar, 1 keputusan\]

Di tanggal berakhir, tidak ada anggota yang perlu menekan tombol: penjadwal memanggil settle-up, kelebihan dikembalikan, kekurangan ditarik sampai batas jaminan, dan sisanya jadi tagihan. Kalau kas habis sebelum tanggal berakhir, pemakaian ditolak dan app mengajak anggota menambah dana.

## Daftar layar untuk wireframe

Total 13 layar. Wireframe dikerjakan sesuai urutan prioritas: layar P0 yang muncul di demo lebih dulu, kartu simulasi (P2) terakhir.

| No | Layar | Isi utama | Aksi utama | FR |
| --- | --- | --- | --- | --- |
| 1 | Buka Tekosoe | Logo, satu kalimat nilai produk | Mulai | FR-01 |
| 2 | Masuk dengan Face ID | Penjelasan singkat bahwa tidak perlu password | Lanjut dengan Face ID; Sudah punya akun | FR-01, FR-02 |
| 3 | Beranda | Daftar grup: isi kas, saldo saya, sisa hari sampai berakhir | Buka grup; Buat grup | FR-13 |
| 4 | Buat grup | Nama, tanggal berakhir, batas persetujuan, link undangan | Buat; Bagikan link | FR-04, FR-05 |
| 5 | Link undangan | Nama grup, pengundang, anggota, tanggal berakhir | Gabung dengan Face ID | FR-05 |
| 6 | Gabung + setor | Batas jaminan, nominal setoran awal | Gabung dan setor | FR-05, FR-06 |
| 7 | Detail grup | Isi kas, saldo bersih saya, feed, perkiraan hasil settle-up, hitung mundur | Tambah dana, Pakai kas, Kartu | FR-13, FR-14, FR-15 |
| 8 | Tambah dana | Nominal dalam dolar | Setor | FR-06 |
| 9 | Pakai kas | Penerima (anggota atau alamat), nominal, catatan, foto struk, untuk siapa (default semua), rata/manual | Bayar dari kas | FR-07, FR-08, FR-17 |
| 10 | Menunggu persetujuan | Detail pemakaian di atas batas | Setujui; Tolak | FR-09 |
| 11 | Detail pemakaian | Rincian untuk siapa, sisa waktu keberatan | Tolak bagian saya | FR-10 |
| 12 | Kartu (simulasi) | Kartu virtual Tekosoe dengan label simulasi, daftar toko demo | Bayar di toko | FR-16 |
| 13 | Hasil settle-up | Setor, pakai, saldo bersih tiap anggota; pengembalian dan tarikan yang sudah terjadi | Lunasi tagihan (kalau ada) | FR-11, FR-12 |

**Status transaksi di semua layar:** tampilkan "Memproses" lalu "Selesai" dalam hitungan detik, tanpa kata hash, gas, atau blockchain.

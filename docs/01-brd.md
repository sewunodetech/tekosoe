# Tekosoe — Business Requirements Document (BRD)

Sep 27, 2026 · @Kyy

Tekosoe adalah aplikasi mobile untuk uang grup lintas negara: patungan, mencatat pengeluaran, saling bayar, dan settle-up dalam AUSD dengan settlement instan di Monad, tanpa user perlu memahami blockchain.

## Latar belakang & masalah bisnis

Orang yang bepergian atau berkegiatan bersama lintas negara belum punya cara yang mudah untuk mengelola uang bersama. Pencatatan dan pembayaran terpisah, dan pembayarannya lambat serta mahal.

**Kondisi saat ini**

- Aplikasi split bill seperti Splitwise hanya mencatat utang (IOU). Pelunasannya tetap lewat transfer bank.
- Transfer bank antar negara lambat, kena biaya, dan kena selisih kurs.
- Dompet digital lokal seperti GoPay hanya berlaku di satu negara, jadi tidak bisa dipakai bersama teman dari negara lain.
- Aplikasi kripto yang bisa lintas negara masih menuntut seed phrase, extension, dan token gas, sehingga tidak ramah bagi orang awam.

**Contoh kasus.** Tiga teman dari Indonesia, Singapura, dan Australia liburan bersama di Jepang. Mereka harus mencatat siapa bayar apa, menghitung utang, lalu saling transfer lewat bank di tiga negara berbeda setelah trip selesai.

## Tujuan bisnis & ukuran keberhasilan

Tujuan jangka pendek adalah memenangkan hackathon Monad Metropolis; tujuan jangka panjang adalah membawa Tekosoe menjadi produk nyata lewat program residensi dan dukungan ekosistem Monad.

| Tujuan | Ukuran keberhasilan | Jangka |
| --- | --- | --- |
| Masuk 3 besar track Consumer Products & Payments | Pengumuman pemenang 3 November 2026 | Hackathon |
| Memenangkan bounty Agora Cross-Border | Semua syarat bounty terpenuhi dan terlihat di demo | Hackathon |
| Memenangkan bounty pendukung (Mera UX, Mera PRF, Envio, Alchemy) | Integrasi real di testnet, dijelaskan per sponsor di README | Hackathon |
| Membuktikan orang awam bisa memakai tanpa bantuan | Satu penguji non-kripto menyelesaikan transaksi pertama tanpa dibantu | Hackathon |
| Mendapat undangan residensi dan dukungan ekosistem Monad | Undangan dari Monad Foundation | Setelah hackathon |
| Siap dipakai dengan uang sungguhan | Kontrak diaudit, deploy ke mainnet, on-ramp dan off-ramp tersedia | Setelah hackathon |

## Pengguna sasaran & pemangku kepentingan

Pengguna utama adalah kelompok teman dari negara berbeda yang bepergian atau berkegiatan bersama, dan yang bukan pengguna kripto.

**Segmen pengguna**

| Segmen | Kebutuhan | Prioritas |
| --- | --- | --- |
| Teman dari beberapa negara yang liburan bersama | Patungan dan saling bayar lintas negara tanpa bank | Utama (fokus demo) |
| Rombongan dari satu negara yang liburan ke luar negeri | Kas bersama dan belanja di negara tujuan | Berikutnya (butuh kartu) |
| Keluarga atau tim yang tersebar di beberapa negara | Kas bersama untuk acara atau kebutuhan rutin | Berikutnya |

**Pemangku kepentingan**

| Pihak | Kepentingan |
| --- | --- |
| Pengguna akhir | Uang aman, cepat sampai, mudah dipakai |
| Juri track | Kualitas produk, teknis, integrasi Monad, kecocokan track, inovasi |
| Agora (AUSD) | Pemakaian AUSD untuk pembayaran lintas negara |
| Monad Foundation / Category Labs (Mera) | Mera sebagai seluruh account layer; penggunaan kreatif kunci turunan passkey |
| Envio | Data on-chain dari HyperIndex menggerakkan fitur inti |
| Alchemy | Integrasi layanan Alchemy di Monad |
| Tim Tekosoe | Menang hackathon dan melanjutkan produk |

## Proposisi nilai & pembeda

Tekosoe menyatukan pencatatan dan pelunasan: yang dipindahkan adalah uang sungguhan dalam dolar digital, lintas negara, dalam hitungan detik.

| Aspek | Splitwise | Dompet digital lokal (GoPay) | Transfer bank | Tekosoe |
| --- | --- | --- | --- | --- |
| Mencatat pengeluaran grup | Ya | Terbatas | Tidak | Ya |
| Memindahkan uang sungguhan | Tidak (hanya IOU) | Ya, satu negara | Ya | Ya |
| Lintas negara | Hanya catatan | Tidak | Lambat, berbiaya, kena kurs | Ya, dalam AUSD |
| Kecepatan pelunasan | Tergantung bank | Instan, satu negara | Hari | Detik |
| Perlu pengetahuan kripto | Tidak | Tidak | Tidak | Tidak (Face ID saja) |
| Pihak ketiga memegang dana | Tidak berlaku | Ya | Ya | Tidak; dana di kontrak, kunci di perangkat user |

**Pembeda utama**

Tekosoe adalah shared wallet yang settle-up sendiri: anggota memakai satu kas bersama sampai habis, lalu di tanggal grup berakhir kontrak menghitung dan menyelesaikan siapa harus bayar ke siapa.

- Pelunasan uang sungguhan, bukan sekadar catatan utang.
- Satu mata uang (AUSD) untuk semua anggota, jadi tidak ada selisih kurs di antara mereka.
- Masuk dengan Face ID lewat passkey; tanpa seed phrase dan tanpa token gas.
- Catatan dan struk pengeluaran terenkripsi, jadi pengeluaran grup tidak terbuka untuk publik.

## Kebutuhan bisnis tingkat tinggi

Setiap kebutuhan bisnis di bawah diturunkan menjadi kebutuhan fungsional di PRD.

| ID | Kebutuhan bisnis | Alasan |
| --- | --- | --- |
| BR-01 | User bisa mulai tanpa pengetahuan kripto: tanpa seed phrase, extension, atau token gas | Target pengguna awam; syarat track dan bounty Mera UX |
| BR-02 | Semua nilai uang memakai AUSD | Satu mata uang lintas negara; syarat bounty Agora |
| BR-03 | Anggota grup di negara berbeda bisa menyetor ke dan memakai satu kas bersama | Inti kasus lintas negara |
| BR-04 | Setiap pemakaian kas tercatat transparan bagi anggota dan bisa ditolak oleh yang tidak ikut | Kepercayaan tanpa perantara |
| BR-05 | Di tanggal grup berakhir, saldo diselesaikan otomatis dengan uang sungguhan | Pembeda dari aplikasi pencatat utang |
| BR-06 | Transaksi selesai dalam hitungan detik | Syarat "instant settlement" Agora; pembeda dari bank |
| BR-07 | Tidak ada pihak yang memegang kunci atau dana user selain kontrak; pemakaian besar butuh persetujuan anggota lain | Aman dan sesuai syarat "no custody backend" |
| BR-08 | Catatan dan struk pengeluaran tidak terbaca publik | Privasi; bounty Mera PRF |
| BR-09 | Semua integrasi sponsor berjalan nyata di Monad testnet | Syarat penilaian bounty |
| BR-10 | Kas bisa dipakai siapa pun sampai habis, dan pemakaian tercatat otomatis tanpa input manual | Inti konsep shared wallet |
| BR-11 | Demo menunjukkan belanja langsung dari kas di toko lewat kartu simulasi | Menunjukkan visi produk; kartu sungguhan di roadmap |

## Model bisnis, batasan & asumsi

Model bisnis belum diputuskan dan tidak dibutuhkan untuk hackathon, tetapi juri yang berasal dari investor kemungkinan akan menanyakannya.

**Kandidat model bisnis (usulan, belum diputuskan)**

- Biaya kecil per settle-up atau per transfer lintas negara.
- Komisi dari on-ramp dan off-ramp fiat lewat mitra.
- Pendapatan dari kartu untuk belanja di negara tujuan.

**Batasan**

- Deadline submission 13 Oktober 2026 pukul 23.59 ET.
- Hanya Monad testnet; tidak ada uang sungguhan selama hackathon.
- Account layer hanya Mera; tidak memakai Privy atau wallet lain.
- On-ramp dan off-ramp (misalnya Mercuryo) hanya di roadmap; kartu hanya disimulasikan di demo, kartu sungguhan (misalnya lewat mitra Visa) di roadmap.

**Asumsi**

- AUSD dan faucet-nya tersedia di Monad testnet.
- Mera bisa dipakai di perangkat mobile dengan passkey yang tersinkron.
- Gas bisa disponsori tanpa backend memegang kunci user.

**Pertanyaan terbuka**

- [ ] Model bisnis mana yang dipilih untuk pitch?
- [x] Apakah app dibangun native (Expo/React Native) atau PWA? Diputuskan: native dengan Expo.
- [ ] Aspek regulasi transfer lintas negara untuk versi mainnet

## Dokumen terkait

- Kebutuhan produk: PRD
- Spesifikasi teknis: Spesifikasi Teknis
- User stories: User Stories
- Rencana pengembangan, uji, timeline, dan checklist submission: Monad Metropolis — Dokumen Pengembangan

# Tekosoe — Product Requirements Document (PRD)

## Ringkasan & tujuan produk

Versi hackathon Tekosoe (v0.1) adalah shared wallet yang settle-up sendiri: tiga orang di tiga negara menyetor AUSD ke satu kas, memakai kas bersama sampai habis, lalu di tanggal grup berakhir kontrak otomatis menghitung dan menyelesaikan siapa harus bayar ke siapa. Semua di Monad testnet, hanya dengan Face ID.

**Pernyataan produk.** Untuk teman dan keluarga yang tersebar di beberapa negara, Tekosoe adalah dompet grup yang mencatat sekaligus melunasi pengeluaran bersama dalam dolar digital, dalam hitungan detik, tanpa bank dan tanpa pengetahuan kripto.

**Tujuan produk v0.1**

1. Onboarding dari link undangan sampai jadi anggota grup dalam satu alur, tanpa seed phrase dan tanpa token gas.
2. Setiap anggota bisa memakai kas bersama selama saldonya ada, tanpa mencatat apa pun selain memilih "untuk siapa".
3. Semua perpindahan uang terjadi dalam AUSD dan final dalam hitungan detik.
4. Di tanggal berakhir, settle-up berjalan otomatis dan hasilnya sama dengan hitungan manual.

## Persona & perjalanan pengguna

Demo memakai tiga persona dari cerita utama: tiga teman dari Indonesia, Singapura, dan Australia yang liburan bersama di Jepang.

| Persona | Peran di grup | Yang ia butuhkan |
| --- | --- | --- |
| Teman dari Indonesia | Pembuat grup, sering membayar di tempat | Membuat grup cepat, mengundang teman, mencatat pengeluaran di jalan |
| Teman dari Singapura | Anggota | Bergabung tanpa ribet, tahu berapa yang harus dibayar |
| Teman dari Australia | Anggota, belum pernah memakai kripto | Masuk dengan Face ID, tidak perlu memahami istilah kripto |

**Perjalanan pengguna**

| Tahap | Yang dilakukan user | Yang terjadi di balik layar |
| --- | --- | --- |
| 1. Sebelum trip | Pembuat grup membuat grup "Trip Jepang", memilih tanggal berakhir, lalu membagikan link | Akun Mera dari passkey; `createGroup` |
| 2. Bergabung | Anggota membuka link, Face ID, memilih batas jaminan, lalu setor dana awal | `joinGroup` + `approve` batas izin tarik; `deposit` AUSD; gas disponsori |
| 3. Memakai kas | Anggota membayar dari kas (ganti ke teman yang bayar di tempat, atau ke penerima lain) dan memilih untuk siapa | `spend`; tercatat otomatis; feed diperbarui lewat Envio |
| 4. Nominal besar | Pemakaian di atas batas grup menunggu persetujuan satu anggota lain | `spend` berstatus Pending, lalu `approveSpend` |
| 5. Belanja di toko (P2) | Anggota tap kartu Tekosoe (simulasi) di toko demo | `spend` dari kas ke alamat toko demo |
| 6. Keberatan | Anggota yang tidak ikut menolak bagiannya | `disputeShare` dalam jendela keberatan |
| 7. Kas menipis | App mengajak anggota menambah dana | `deposit` tambahan |
| 8. Tanggal berakhir | Tidak ada yang perlu dilakukan; semua anggota menerima ringkasan dan pengembalian otomatis | Penjadwal memanggil `settle`; kekurangan ditarik dalam batas jaminan; kelebihan dikembalikan |
| 9. Sisa tagihan | Anggota yang kurang melebihi batas jaminan melunasi tagihannya | `payDebt` |

## Kebutuhan fungsional

Prioritas mengikuti lapisan scope: P0 wajib untuk track dan bounty utama, P1 untuk Envio, P2 untuk Mera PRF, P3 untuk Alchemy.

| ID | Kebutuhan | BRD | Prioritas |
| --- | --- | --- | --- |
| FR-01 | User membuat akun dengan passkey (Face ID/sidik jari) tanpa seed phrase | BR-01 | P0 |
| FR-02 | User masuk kembali di perangkat lain dengan passkey yang sama dan mendapat akun yang sama | BR-01 | P0 |
| FR-03 | User bertransaksi tanpa pernah memegang atau membeli token gas | BR-01, BR-07 | P0 |
| FR-04 | User membuat grup dengan nama, tanggal berakhir, dan batas persetujuan | BR-03 | P0 |
| FR-05 | User mengundang anggota lewat link; penerima bergabung dengan passkey dan memilih batas jaminan | BR-03, BR-05 | P0 |
| FR-06 | Anggota menyetor AUSD ke kas kapan saja sebelum tanggal berakhir | BR-02, BR-03 | P0 |
| FR-07 | Anggota memakai kas selama saldonya cukup, tanpa melihat jumlah setorannya sendiri | BR-10 | P0 |
| FR-08 | Setiap pemakaian mencatat penerima, nominal, dan untuk siapa (default semua anggota, pembagian rata atau manual) | BR-04, BR-10 | P0 |
| FR-09 | Pemakaian di atas batas grup butuh persetujuan satu anggota lain | BR-07 | P0 |
| FR-10 | Peserta bisa menolak bagiannya dalam jendela keberatan; bagian itu pindah ke pemakai | BR-04 | P0 |
| FR-11 | Di tanggal berakhir, settle-up berjalan otomatis: kekurangan ditarik dalam batas jaminan, kelebihan dikembalikan | BR-05 | P0 |
| FR-12 | Kekurangan di atas batas jaminan menjadi tagihan yang bisa dilunasi di app | BR-05 | P0 |
| FR-13 | Semua nominal ditampilkan dalam dolar tanpa istilah kripto | BR-01 | P0 |
| FR-14 | Feed aktivitas grup diperbarui tanpa refresh manual | BR-04 | P1 |
| FR-15 | Saldo tiap anggota (setor, pakai, saldo bersih) dan perkiraan hasil settle-up | BR-04, BR-05 | P1 |
| FR-16 | Kartu Tekosoe (simulasi) untuk membayar toko demo langsung dari kas | BR-11 | P2 |
| FR-17 | Catatan dan foto struk dienkripsi dengan kunci turunan passkey; hanya anggota yang bisa membuka | BR-08 | P2 |
| FR-18 | Push notification untuk pemakaian baru, permintaan persetujuan, dan hasil settle-up | BR-04 | P3 |
| FR-19 | Pemakai bisa melampirkan struk dari penjual (foto atau PDF, lebih dari satu halaman) saat membayar atau sesudahnya; struk dienkripsi di HP dan fingerprint-nya dicatat on-chain lewat attachReceipt | BR-04, BR-08 | P0 |
| FR-20 | Anggota membuka struk dengan Face ID; Activity menandai "Receipt" atau "No receipt"; penyetuju melihat peringatan kalau pengeluaran besar belum punya struk | BR-04, BR-08 | P0 |
| FR-21 | OCR di HP membaca nominal, toko, dan tanggal dari struk, lalu memberi peringatan kalau nominalnya berbeda dengan pembayaran | BR-04 | P1 |
| FR-22 | Setelah settle, tiap anggota mendapat invoice in-app: status Paid, Refunded, atau Due; setiap baris tertaut ke transaksinya; invoice Due punya tombol Pay yang memanggil payDebt; bisa disimpan sebagai PDF lewat expo-print | BR-04, BR-05 | P0 |
| FR-23 | PDF invoice dibuat di server dan dikirim lewat email, dengan perkiraan mata uang lokal (kurs dikunci saat settle, berlabel approx) | BR-05 | P1 |

## Kebutuhan non-fungsional

Angka target di bawah adalah target tim untuk demo, bukan jaminan; angka nyata diukur saat uji integrasi.

| ID | Kategori | Kebutuhan |
| --- | --- | --- |
| NFR-01 | Keamanan | Kunci user tidak pernah meninggalkan perangkat; tidak ada backend yang menyimpan kunci atau dana |
| NFR-02 | Keamanan | Kontrak: state diubah sebelum transfer, `nonReentrant`, `SafeERC20`, hanya anggota yang bisa bertindak |
| NFR-03 | Integritas | Jumlah saldo bersih semua anggota selalu sama dengan isi kas, dan isi kas selalu sama dengan saldo AUSD grup di kontrak |
| NFR-04 | Privasi | Catatan dan struk tidak pernah disimpan sebagai teks biasa on-chain |
| NFR-05 | Kinerja | Transaksi tampil di feed semua anggota dalam beberapa detik (diukur saat uji) |
| NFR-06 | Kegunaan | Penguji non-kripto menyelesaikan transaksi pertama tanpa bantuan |
| NFR-07 | Kegunaan | Tidak ada kata "wallet", "gas", "seed phrase", atau "blockchain" di layar user |
| NFR-08 | Platform | App native iOS dan Android, dibangun dengan Expo (React Native) |
| NFR-09 | Keterverifikasian | Alamat kontrak dan hash transaksi testnet tercantum di README; repo publik dengan riwayat commit selama hackathon |

## Metrik keberhasilan & kriteria rilis

v0.1 siap disubmit kalau semua kebutuhan P0 lolos uji dan skenario demo berjalan end-to-end di testnet tanpa langkah manual di belakang layar.

**Metrik yang diukur saat uji**

- Waktu dari membuka link undangan sampai menjadi anggota grup.
- Waktu dari transaksi dikirim sampai tampil di feed anggota lain.
- Jumlah langkah di mana penguji non-kripto meminta bantuan (target: nol).
- Selisih antara hasil settle-up di app dan hitungan manual (target: nol).

**Kriteria rilis v0.1**

- [ ] FR-01 sampai FR-13 berfungsi di Monad testnet, termasuk settle-up otomatis
- [ ] Unit dan fuzz test kontrak lolos; scan Slither tanpa temuan serius
- [ ] Skenario tiga negara berjalan end-to-end dengan AUSD asli testnet
- [ ] Tidak ada istilah kripto di layar user
- [ ] README, video demo, dan profil project di dashboard lengkap

## Di luar scope & fase berikutnya

Fitur di bawah sengaja tidak dibangun di v0.1 supaya produk inti selesai dengan rapi sebelum deadline.

| Fitur | Alasan ditunda | Fase |
| --- | --- | --- |
| Persetujuan untuk setiap pemakaian | Membebani UX; cukup untuk nominal di atas batas grup | Tidak direncanakan |
| On-ramp dan off-ramp fiat (misalnya Mercuryo) | Bukan bounty; butuh integrasi mitra dan KYC | Setelah hackathon |
| Kartu sungguhan (misalnya lewat mitra issuer Visa) | Butuh mitra penerbit kartu dan KYC; di demo diganti kartu simulasi | Setelah hackathon |
| Token selain AUSD | Tidak diperlukan untuk kasus inti | Setelah hackathon |
| Mainnet | Kontrak belum diaudit | Setelah audit |

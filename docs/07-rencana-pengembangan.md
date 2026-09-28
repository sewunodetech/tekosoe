# Monad Metropolis — Dokumen Pengembangan

Sep 26, 2026 · @Kyy

## Ringkasan & tujuan

Kita membangun aplikasi mobile untuk **uang grup lintas negara**: teman, keluarga, atau tim di negara berbeda bisa patungan, mencatat pengeluaran, saling bayar, dan settle-up dalam AUSD dengan settlement instan di Monad. User tidak pernah melihat seed phrase, extension, atau token gas.

**Cerita utama.** Tiga teman dari Indonesia, Singapura, dan Australia janjian liburan di Jepang. Masing-masing menyetor AUSD dari negaranya sendiri, lalu selama trip mereka patungan, mencatat pengeluaran, dan saling bayar lewat app. Di akhir trip, settle-up selesai dalam hitungan detik tanpa transfer bank antar negara. Rombongan dari satu negara yang liburan ke luar negeri (misalnya wisatawan Indonesia) adalah pasar berikutnya, dan belanja langsung di negara tujuan lewat kartu masuk roadmap.

**Masalah.** Aplikasi split bill seperti Splitwise hanya mencatat utang (IOU); pelunasannya tetap lewat transfer bank yang lambat, mahal, dan terkena kurs, apalagi lintas negara. Dompet digital lokal seperti GoPay tidak bisa dipakai lintas negara.

**Solusi.** Pencatatan dan pelunasan terjadi di satu tempat: saldo grup dipegang kontrak, expense dicatat on-chain, dan settle-up memindahkan uang sungguhan (AUSD), bukan sekadar angka.

**Tujuan hackathon**

1. Masuk 3 besar track Consumer Products & Payments.
2. Memenangkan bounty Agora Cross-Border ($10.000) sebagai target utama.
3. Mengambil bounty pendukung yang sejalan: Mera UX, Mera PRF, Envio, dan Alchemy (opsional).

**Prinsip produk**

- Tidak pernah menyebut blockchain kepada user; yang terlihat hanya "Face ID" dan saldo dalam dolar.
- Semua integrasi sponsor harus real di testnet, bukan mock.
- Satu account layer saja: Mera. Tidak ada Privy atau "connect wallet".

## Target track & bounty

Satu project, satu track (Consumer Products & Payments), lima bounty. Setiap sponsor punya peran yang berbeda supaya integrasinya terlihat bermakna dan tidak tumpang tindih.

| Target | Hadiah | Syarat (dari dashboard) | Cara kita memenuhinya | Prioritas |
| --- | --- | --- | --- | --- |
| Track: Consumer Products & Payments | $30.000 dibagi 3 tim | Produk finansial untuk user yang bukan pengguna kripto, rail on-chain sebagai keunggulan | Uang grup lintas negara tanpa istilah blockchain di UI | Wajib |
| Agora: Best Cross-Border Payments App | $10.000 | Aplikasi mobile untuk mengirim AUSD lintas negara, onboarding passkey Mera, settlement instan | Kas bersama dalam AUSD: setor, pakai, dan settle-up otomatis; onboarding Mera; demo anggota dari negara berbeda | Wajib |
| Monad Foundation: Best Mera-Powered UX | $2.500 | Mera sebagai seluruh account layer: tanpa seed phrase, extension, atau custody backend | Tidak ada wallet lain; gas disponsori tanpa backend memegang kunci; undangan grup lewat link + Face ID | Wajib |
| Envio: Best Use of Envio | $1.000 | HyperIndex/HyperSync/HyperRPC menggerakkan data on-chain untuk fitur inti | HyperIndex mengindeks event kontrak untuk feed aktivitas, saldo, dan "siapa berutang ke siapa" | Disarankan |
| Monad Foundation: Mera — One Passkey, Many Keys | $2.500 | Penggunaan non-wallet paling kreatif dari key material turunan PRF Mera | Kunci enkripsi turunan passkey untuk catatan expense dan foto struk yang terenkripsi | Kalau sempat |
| Alchemy: Best Projects using Alchemy | $1.000 kredit | Integrasi bermakna minimal satu layanan Alchemy di Monad | Gas Manager untuk sponsor gas (atau bayar gas dengan AUSD); Webhooks untuk push notification | Opsional |

**Bukan target bounty:** Mercuryo (hadiah untuk pemenang berupa credits, bukan bounty) dan Privy (bentrok dengan Mera sebagai account layer).

**Pembagian peran sponsor:** Mera = identitas dan signing; AUSD = uang; Monad = settlement; Envio = sumber data yang dibaca app; Alchemy = gas dan pemicu notifikasi.

## Scope bertingkat

Scope disusun berlapis: kalau waktu habis di lapisan mana pun, yang sudah jadi tetap produk utuh yang bisa didemokan. Jangan mulai lapisan berikutnya sebelum lapisan sebelumnya jalan end-to-end di testnet.

**P0 — Wajib (track + Agora + Mera UX)**

- [ ] Onboarding passkey Mera: buat akun dan masuk kembali di perangkat lain dengan passkey yang sama
- [ ] Gas tanpa MON milik user (drip MON otomatis, relayer sendiri, atau Alchemy)
- [ ] Buat grup dengan tanggal berakhir dan batas persetujuan; undang anggota lewat link
- [ ] Gabung sambil memilih batas jaminan (izin tarik) dan setor dana awal
- [ ] Pakai kas selama isinya cukup, dengan pilihan untuk siapa; tercatat otomatis
- [ ] Persetujuan satu anggota lain untuk pemakaian di atas batas
- [ ] Keberatan bagian oleh peserta yang tidak ikut
- [ ] Settle-up otomatis di tanggal berakhir lewat penjadwal; tagihan untuk sisa kekurangan
- [ ] UI tanpa istilah blockchain, saldo ditampilkan dalam dolar
- [ ] Metadata off-chain di Supabase lewat API backend: profil, nama grup, judul pengeluaran, struk terenkripsi; hash metadata dicocokkan dengan noteHash
- [ ] Struk dari penjual: foto/PDF terenkripsi di HP, attachReceipt on-chain, dibuka dengan Face ID, tanda Receipt/No receipt di Activity
- [ ] Invoice per anggota setelah settle: status Paid/Refunded/Due, tombol Pay untuk utang, tautan tiap baris ke transaksi, simpan PDF lewat expo-print

**P1 — Disarankan (Envio)**

- [ ] Indexer HyperIndex untuk event kontrak
- [ ] Feed aktivitas grup real-time
- [ ] Saldo per anggota dan ringkasan "siapa berutang ke siapa" dibaca dari indexer
- [ ] OCR struk dengan peringatan nominal berbeda; PDF invoice dari server, email, dan perkiraan mata uang lokal

**P2 — Kalau sempat (Mera PRF)**

- [ ] Kartu Tekosoe (simulasi): pembayaran nyata dari kas ke alamat toko demo, berlabel simulasi, tanpa logo Visa
- [ ] Kunci enkripsi turunan passkey, terpisah dari kunci signing
- [ ] Catatan dan foto struk dienkripsi; on-chain hanya hash atau ciphertext
- [ ] Versi lanjutan: kunci grup yang bisa dibaca semua anggota

**P3 — Opsional (Alchemy)**

- [ ] Uji Gas Manager dengan akun Mera (batas waktu setengah hari)
- [ ] Webhooks untuk push notification expense baru dan tagihan top-up

**Roadmap (disebut di pitch, tidak dibangun)**

- On-ramp dan off-ramp fiat (misalnya Mercuryo)
- Kartu sungguhan untuk belanja dari kas (misalnya lewat mitra issuer Visa)
- Deploy ke mainnet setelah audit

**Di luar scope:** persetujuan untuk setiap pemakaian, mainnet, kartu sungguhan, dan token selain AUSD.

## Arsitektur & desain teknis

App menandatangani transaksi dengan kunci dari passkey Mera, sponsor gas membayar gas, kontrak GroupVault memindahkan AUSD, dan Envio mengubah event kontrak menjadi data yang dibaca app.

&#91;embedded content: arsitektur · 6 komponen\]

Kunci user tidak pernah keluar dari perangkat. Sponsor gas hanya membayar gas; ia tidak memegang kunci atau dana user.

### Komponen

| Komponen | Teknologi | Tanggung jawab |
| --- | --- | --- |
| App mobile | TypeScript; Expo (React Native), build lewat EAS | Onboarding, grup, expense, transfer, settle-up |
| Account layer | Mera (`@category-labs/mera`) | Akun dari passkey, signing session, kunci turunan untuk enkripsi |
| Kontrak | Solidity + Foundry, OpenZeppelin | Vault grup, ledger saldo, expense, transfer, settle-up |
| Uang | AUSD di Monad testnet (6 desimal) | Semua nominal dan settlement |
| Indexer | Envio HyperIndex | Feed aktivitas, saldo per anggota, riwayat |
| Gas | Alchemy Gas Manager, atau drip MON / relayer sendiri | User tidak pernah memegang MON |
| Notifikasi (opsional) | Alchemy Webhooks | Push notification ke anggota |
| Database off-chain | Supabase (Postgres + Storage), diakses lewat backend mini | Profil, nama grup, judul dan catatan pengeluaran, struk terenkripsi, status baca, langganan push; tidak pernah menyimpan saldo |

### Kontrak GroupVault (draf fungsi)

- `createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold)` membuat grup dengan tanggal berakhir
- `joinGroup(groupId, inviteSecret, pullCap)` bergabung dan mencatat batas jaminan (bersama `approve` AUSD)
- `deposit(groupId, amount)` menyetor atau menambah dana ke kas
- `spend(groupId, to, amount, participants, shares, noteHash)` memakai kas; di atas batas menunggu `approveSpend` atau `rejectSpend`
- `disputeShare(groupId, spendId)` memindahkan bagian peserta yang tidak ikut ke pemakai
- `settle(groupId)` dipanggil penjadwal setelah tanggal berakhir: tarik kekurangan sampai batas jaminan, kembalikan kelebihan
- `payDebt(groupId, amount)` melunasi sisa tagihan

Spesifikasi lengkap (state, syarat, contoh perhitungan) ada di tab Spesifikasi Teknis dokumen Tekosoe.

**Event untuk Envio:** `GroupCreated`, `MemberJoined`, `Deposited`, `SpendRequested`, `SpendExecuted`, `SpendRejected`, `ShareDisputed`, `Settled`, `Pulled`, `Refunded`, `DebtPaid`.

**Aturan keamanan:** state diubah sebelum transfer, `nonReentrant` pada semua fungsi yang memindahkan dana, `SafeERC20`, hanya anggota yang bisa bertindak, total saldo bersih grup harus selalu nol.

### Alur utama

1. User membuka link undangan, Face ID, memilih batas jaminan, dan menyetor dana awal.
2. Anggota memakai kas bersama selama isinya cukup dan memilih untuk siapa; semuanya tercatat otomatis.
3. Pemakaian besar menunggu persetujuan satu anggota lain; peserta yang tidak ikut bisa menolak bagiannya.
4. Kalau kas menipis, anggota menambah dana.
5. Di tanggal berakhir, penjadwal memanggil settle-up: kelebihan dikembalikan, kekurangan ditarik sampai batas jaminan, sisanya jadi tagihan.

### Keputusan desain

- Kas bersama murni: siapa pun boleh memakai sampai habis, tanpa melihat setorannya sendiri; perhitungan adil dilakukan saat settle-up.
- Persetujuan hanya untuk pemakaian di atas batas grup, bukan setiap transaksi.
- Kontrak tidak bisa menarik dana tanpa izin, jadi kekurangan hanya ditarik otomatis sampai batas jaminan; sisanya jadi tagihan.
- Nominal disimpan dalam unit AUSD (6 desimal); konversi ke tampilan dolar hanya di app.
- Catatan dan struk tidak pernah disimpan dalam teks biasa on-chain; hanya hash atau ciphertext.

## Rencana uji

Setiap lapisan scope baru dianggap selesai kalau lolos uji di level-nya dan berjalan end-to-end di testnet. Uji yang paling penting adalah konservasi nilai: AUSD tidak boleh tercipta atau hilang di vault.

### 1. Kontrak (Foundry)

- [ ] Unit test tiap fungsi: jalur sukses dan setiap `revert`
- [ ] Hanya anggota yang bisa setor, memakai kas, menyetujui, dan menolak bagian
- [ ] Pemakaian ditolak kalau melebihi isi kas atau setelah tanggal berakhir
- [ ] Pemakaian di atas batas tidak dibayar sebelum disetujui anggota lain; pemakai tidak bisa menyetujui dirinya sendiri
- [ ] Keberatan ditolak setelah jendela keberatan ditutup
- [ ] `settle` ditolak sebelum `endsAt + disputeWindow`; tidak bisa dijalankan dua kali
- [ ] Settle: tarikan tidak pernah melebihi `pullCap`; kalau saldo atau izin kurang, sisa jadi `debt`
- [ ] Settle: contoh A, B, C di Spesifikasi Teknis menghasilkan angka yang sama persis
- [ ] Fuzz: untuk urutan acak setor, pakai, dan keberatan, jumlah saldo bersih semua anggota selalu sama dengan isi kas
- [ ] Fuzz: setelah settle dan semua `payDebt`, total yang diterima = total yang dibayar; kontrak tidak menyisakan dana grup
- [ ] Uji reentrancy dengan token berbahaya (mock hanya untuk tes ini)
- [ ] Scan statis dengan Slither sebelum deploy final

### 2. Integrasi (testnet)

- [ ] Akun Mera dibuat, transaksi pertama berhasil tanpa user memegang MON
- [ ] Passkey yang sama di perangkat kedua menghasilkan alamat yang sama
- [ ] Setor, pakai kas, dan settle-up dengan AUSD asli di Monad testnet; hash transaksi dicatat. Penjadwal memanggil settle tepat waktu
- [ ] Indexer Envio menangkap semua 11 event, dan saldo di indexer sama dengan saldo di kontrak
- [ ] Waktu dari transaksi sampai tampil di feed app diukur dan dicatat
- [ ] (P2) Catatan terenkripsi bisa dibuka anggota, tidak bisa dibuka alamat luar
- [ ] (P3) Gas Manager Alchemy bekerja dengan akun Mera; kalau gagal, fallback dipakai

### 3. End-to-end (skenario demo)

- [ ] Tiga akun di tiga perangkat mewakili teman dari Indonesia, Singapura, dan Australia yang liburan di Jepang
- [ ] Buat grup dengan tanggal berakhir, undang lewat link, semua bergabung dengan Face ID dan setor dana
- [ ] Pemakaian dengan kombinasi peserta berbeda (semua; A dan B saja; A dan C saja)
- [ ] Satu anggota memakai kas melebihi setorannya sendiri, dan tetap berhasil selama kas cukup
- [ ] Satu pemakaian besar disetujui anggota lain; satu peserta menolak bagiannya
- [ ] (P2) Satu pembayaran lewat kartu simulasi ke toko demo
- [ ] Tanggal berakhir lewat, settle-up berjalan otomatis tanpa ada yang menekan tombol
- [ ] Angka akhir di app sama dengan hitungan manual

### 4. UX (orang yang bukan pengguna kripto)

- [ ] Minta satu orang non-kripto mencoba dari nol tanpa dibantu
- [ ] Catat di mana ia bingung dan waktu sampai transaksi pertama
- [ ] Tidak ada kata "wallet", "gas", "seed phrase", atau "blockchain" di layar user

## Timeline

Deadline submission 13 Oktober pukul 23.59 ET, yaitu Oct 14, 2026 pukul 10.59 WIB. Target kita submit tanggal 12 Oktober dan menyisakan satu hari cadangan.

| Tanggal | Fokus | Selesai kalau |
| --- | --- | --- |
| 27–29 Sep | Uji risiko: spike Mera, faucet AUSD testnet, uji gas (Alchemy maks. setengah hari); kontrak v0 + unit test | Satu transaksi AUSD dari akun Mera berhasil tanpa MON milik user |
| 30 Sep – 2 Okt | Kontrak lengkap + fuzz test, deploy ke testnet, indexer Envio | Semua event terindeks, saldo indexer sama dengan kontrak |
| 3–6 Okt | App: onboarding, grup, deposit, expense, transfer, settle-up (P0) | Skenario demo jalan end-to-end di testnet |
| 7–8 Okt | Feed real-time (P1); mulai catatan terenkripsi (P2) kalau P0 dan P1 aman | Feed muncul tanpa refresh manual |
| 9–10 Okt | Uji end-to-end, uji UX dengan orang non-kripto, perbaikan, Slither | Semua checklist uji P0 lolos |
| 11 Okt | Rekam video demo, tulis README dan write-up | Video dan README final |
| 12 Okt | Submit | Status submission tampil lengkap, bukan draf |
| 13 Okt | Cadangan darurat saja | — |

Aturan main: kalau satu fase molor lebih dari satu hari, potong dari lapisan paling bawah (P3, lalu P2), jangan dari P0.

## Checklist submission & rubrik

Menurut FAQ resmi, yang disubmit adalah produk yang berjalan dengan profil project publik: demo, write-up singkat, dan link ke kode. Juri harus bisa memverifikasi apa yang dibangun selama enam minggu hackathon.

### Rubrik track (perlu dicocokkan dengan Rules di dashboard)

Catatan peserta lain menyebut lima kriteria dengan bobot sama (masing-masing 20%). Cara kita menjawab tiap kriteria:

| Kriteria | Bukti yang harus terlihat |
| --- | --- |
| Kualitas & kelengkapan produk | Skenario demo jalan end-to-end, bukan hanya jalur sukses |
| Keunggulan teknis | Unit + fuzz test lolos, Slither bersih, repo rapi |
| Integrasi Monad | Transaksi testnet nyata di video, alamat kontrak dan hash di README, alasan memakai Monad ditulis eksplisit |
| Kecocokan track | UI tanpa istilah kripto; user non-kripto bisa memakai tanpa bantuan |
| Inovasi & dampak | Pelunasan uang sungguhan lintas negara, bukan sekadar IOU; struk terenkripsi |

### Alasan "kenapa Monad" untuk write-up

- Finality cepat, sehingga transfer dan settle-up terasa instan.
- Biaya rendah, sehingga setiap expense kecil layak dicatat on-chain.
- Beberapa anggota mencatat expense bersamaan tanpa saling menunggu.

### Checklist sebelum submit

- [ ] Repo GitHub publik dengan lisensi open source dan riwayat commit sepanjang masa hackathon
- [ ] README: cara menjalankan, alamat kontrak testnet, contoh hash transaksi, arsitektur
- [ ] README: satu bagian per sponsor yang menjelaskan integrasinya (Agora, Mera, Envio, Alchemy)
- [ ] README: pengungkapan penggunaan alat AI dan kode yang sudah ada sebelumnya (kalau ada)
- [ ] Video demo publik yang menunjukkan produk berjalan dan transaksi Monad nyata
- [ ] Profil project di dashboard: nama, deskripsi, track, dan semua bounty yang diincar dipilih
- [ ] Tidak ada private key, API key, atau rahasia lain di repo
- [ ] Status submission dicek tampil lengkap, bukan draf

### Skrip video demo (target maks. 3 menit)

1. **0:00–0:30** Masalah: tiga teman dari Indonesia, Singapura, dan Australia liburan bareng di Jepang; patungan dan saling bayar lintas negara itu lambat, mahal, dan ribet.
2. **0:30–2:00** Demo langsung: undangan lewat link, Face ID, deposit AUSD dari tiga negara, mencatat expense di Jepang, saling bayar, settle-up di akhir trip.
3. **2:00–2:30** Di balik layar: Mera, AUSD, kontrak di Monad, feed dari Envio.
4. **2:30–3:00** Dampak dan roadmap: rombongan wisatawan dari satu negara, kartu untuk belanja di negara tujuan, on-ramp, mainnet.

## Risiko & pertanyaan terbuka

Risiko terbesar adalah Mera: dokumentasinya masih tipis, dan seluruh app bergantung padanya. Karena itu spike Mera dijadwalkan di hari pertama.

### Risiko

| Risiko | Dampak | Rencana cadangan |
| --- | --- | --- |
| API Mera kurang terdokumentasi; AI coding agent bisa mengarang fungsi yang tidak ada | Onboarding molor | Pelajari repo publik yang sudah berhasil integrasi; verifikasi setiap fungsi di source code paket |
| Gas Manager Alchemy tidak cocok dengan EOA Mera | Bounty Alchemy hilang | Drip MON atau relayer sendiri; batas uji setengah hari |
| Faucet AUSD testnet tidak tersedia atau dibatasi | Demo tertunda | Tanya tim Agora di Discord sejak hari pertama |
| SDK Mera atau ekstensi PRF passkey belum berjalan di React Native | Onboarding dan enkripsi struk tertahan | Spike hari pertama: passkey + PRF di iOS dan Android; cadangan: langkah Mera di in-app browser dengan domain yang sama |
| Berbagi kunci enkripsi antar anggota grup lebih rumit dari perkiraan | Bounty Mera PRF lemah | Kirim versi enkripsi per user dulu |
| Scope lima bounty terlalu besar untuk sisa waktu | Produk inti tidak rapi | Potong dari P3 lalu P2, jangan dari P0 |

### Pertanyaan yang harus diverifikasi di aturan resmi

- [ ] Apakah satu project boleh memenangkan beberapa bounty sekaligus?
- [x] Apakah PWA atau web responsif dihitung "mobile app" untuk bounty Agora? Tidak relevan lagi: diputuskan build native dengan Expo.
- [x] Apakah testnet diterima untuk track dan semua bounty?
- [x] Apakah open source wajib? (FAQ publik bilang dianjurkan; tetap buat repo publik)
- [ ] Batas durasi video demo dan kriteria penilaian track yang resmi
- [x] Alamat faucet AUSD di Monad testnet

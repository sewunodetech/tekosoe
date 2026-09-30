# Tekosoe — Dokumen Produk

BRD · PRD · Spesifikasi Teknis · User Stories · User Flow

27 September 2026

Tekosoe adalah aplikasi mobile untuk uang grup lintas negara: patungan, mencatat pengeluaran, saling bayar, dan settle-up dalam AUSD dengan settlement instan di Monad, tanpa user perlu memahami blockchain. Dokumen ini menggabungkan BRD, PRD, Spesifikasi Teknis, User Stories, dan User Flow.

# Bagian 1 — Business Requirements Document (BRD)

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

| **Tujuan** | **Ukuran keberhasilan** | **Jangka** |
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

| **Segmen** | **Kebutuhan** | **Prioritas** |
| --- | --- | --- |
| Teman dari beberapa negara yang liburan bersama | Patungan dan saling bayar lintas negara tanpa bank | Utama (fokus demo) |
| Rombongan dari satu negara yang liburan ke luar negeri | Kas bersama dan belanja di negara tujuan | Berikutnya (butuh kartu) |
| Keluarga atau tim yang tersebar di beberapa negara | Kas bersama untuk acara atau kebutuhan rutin | Berikutnya |

**Pemangku kepentingan**

| **Pihak** | **Kepentingan** |
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

| **Aspek** | **Splitwise** | **Dompet digital lokal (GoPay)** | **Transfer bank** | **Tekosoe** |
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

| **ID** | **Kebutuhan bisnis** | **Alasan** |
| --- | --- | --- |
| BR-01 | User bisa mulai tanpa pengetahuan kripto: tanpa seed phrase, extension, atau token gas | Target pengguna awam; syarat track dan bounty Mera UX |
| BR-02 | Semua nilai uang memakai AUSD | Satu mata uang lintas negara; syarat bounty Agora |
| BR-03 | Anggota grup di negara berbeda bisa menyetor ke dan memakai satu kas bersama | Inti kasus lintas negara |
| BR-04 | Setiap pemakaian kas tercatat transparan bagi anggota dan bisa ditolak oleh yang tidak ikut | Kepercayaan tanpa perantara |
| BR-05 | Di tanggal grup berakhir, saldo diselesaikan otomatis dengan uang sungguhan | Pembeda dari aplikasi pencatat utang |
| BR-06 | Transaksi selesai dalam hitungan detik | Syarat “instant settlement” Agora; pembeda dari bank |
| BR-07 | Tidak ada pihak yang memegang kunci atau dana user selain kontrak; pemakaian besar butuh persetujuan anggota lain | Aman dan sesuai syarat “no custody backend” |
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

- ☐ Model bisnis mana yang dipilih untuk pitch?
- ☐ Apakah app dibangun native (Expo/React Native) atau PWA?

- ☐ Aspek regulasi transfer lintas negara untuk versi mainnet

# Bagian 2 — Product Requirements Document (PRD)

## Ringkasan & tujuan produk

Versi hackathon Tekosoe (v0.1) adalah shared wallet yang settle-up sendiri: tiga orang di tiga negara menyetor AUSD ke satu kas, memakai kas bersama sampai habis, lalu di tanggal grup berakhir kontrak otomatis menghitung dan menyelesaikan siapa harus bayar ke siapa. Semua di Monad testnet, hanya dengan Face ID.

**Pernyataan produk.** Untuk teman dan keluarga yang tersebar di beberapa negara, Tekosoe adalah dompet grup yang mencatat sekaligus melunasi pengeluaran bersama dalam dolar digital, dalam hitungan detik, tanpa bank dan tanpa pengetahuan kripto.

**Tujuan produk v0.1**

- Onboarding dari link undangan sampai jadi anggota grup dalam satu alur, tanpa seed phrase dan tanpa token gas.
- Setiap anggota bisa memakai kas bersama selama saldonya ada, tanpa mencatat apa pun selain memilih “untuk siapa”.

- Semua perpindahan uang terjadi dalam AUSD dan final dalam hitungan detik.
- Di tanggal berakhir, settle-up berjalan otomatis dan hasilnya sama dengan hitungan manual.

## Persona & perjalanan pengguna

Demo memakai tiga persona dari cerita utama: tiga teman dari Indonesia, Singapura, dan Australia yang liburan bersama di Jepang.

| **Persona** | **Peran di grup** | **Yang ia butuhkan** |
| --- | --- | --- |
| Teman dari Indonesia | Pembuat grup, sering membayar di tempat | Membuat grup cepat, mengundang teman, mencatat pengeluaran di jalan |
| Teman dari Singapura | Anggota | Bergabung tanpa ribet, tahu berapa yang harus dibayar |
| Teman dari Australia | Anggota, belum pernah memakai kripto | Masuk dengan Face ID, tidak perlu memahami istilah kripto |

**Perjalanan pengguna**

| **Tahap** | **Yang dilakukan user** | **Yang terjadi di balik layar** |
| --- | --- | --- |
| 1. Sebelum trip | Pembuat grup membuat grup “Trip Jepang”, memilih tanggal berakhir, lalu membagikan link | Akun Mera dari passkey; createGroup |
| 2. Bergabung | Anggota membuka link, Face ID, memilih batas jaminan, lalu setor dana awal | joinGroup + approve batas izin tarik; deposit AUSD; gas disponsori |
| 3. Memakai kas | Anggota membayar dari kas (ganti ke teman yang bayar di tempat, atau ke penerima lain) dan memilih untuk siapa | spend; tercatat otomatis; feed diperbarui lewat Envio |
| 4. Nominal besar | Pemakaian di atas batas grup menunggu persetujuan satu anggota lain | spend berstatus Pending, lalu approveSpend |
| 5. Belanja di toko (P2) | Anggota tap kartu Tekosoe (simulasi) di toko demo | spend dari kas ke alamat toko demo |
| 6. Keberatan | Anggota yang tidak ikut menolak bagiannya | disputeShare dalam jendela keberatan |
| 7. Kas menipis | App mengajak anggota menambah dana | deposit tambahan |
| 8. Tanggal berakhir | Tidak ada yang perlu dilakukan; semua anggota menerima ringkasan dan pengembalian otomatis | Penjadwal memanggil settle; kekurangan ditarik dalam batas jaminan; kelebihan dikembalikan |
| 9. Sisa tagihan | Anggota yang kurang melebihi batas jaminan melunasi tagihannya | payDebt |

## Kebutuhan fungsional

Prioritas mengikuti lapisan scope: P0 wajib untuk track dan bounty utama, P1 untuk Envio, P2 untuk kartu simulasi dan Mera PRF, P3 untuk Alchemy.

| **ID** | **Kebutuhan** | **BRD** | **Prioritas** |
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

## Kebutuhan non-fungsional

Angka target di bawah adalah target tim untuk demo, bukan jaminan; angka nyata diukur saat uji integrasi.

| **ID** | **Kategori** | **Kebutuhan** |
| --- | --- | --- |
| NFR-01 | Keamanan | Kunci user tidak pernah meninggalkan perangkat; tidak ada backend yang menyimpan kunci atau dana |
| NFR-02 | Keamanan | Kontrak: state diubah sebelum transfer, nonReentrant, SafeERC20, hanya anggota yang bisa bertindak |
| NFR-03 | Integritas | Jumlah saldo bersih semua anggota selalu sama dengan isi kas, dan isi kas selalu sama dengan saldo AUSD grup di kontrak |
| NFR-04 | Privasi | Catatan dan struk tidak pernah disimpan sebagai teks biasa on-chain |
| NFR-05 | Kinerja | Transaksi tampil di feed semua anggota dalam beberapa detik (diukur saat uji) |
| NFR-06 | Kegunaan | Penguji non-kripto menyelesaikan transaksi pertama tanpa bantuan |
| NFR-07 | Kegunaan | Tidak ada kata “wallet”, “gas”, “seed phrase”, atau “blockchain” di layar user |
| NFR-08 | Platform | Berjalan di ponsel (native atau PWA, menunggu keputusan) |
| NFR-09 | Keterverifikasian | Alamat kontrak dan hash transaksi testnet tercantum di README; repo publik dengan riwayat commit selama hackathon |

## Metrik keberhasilan & kriteria rilis

v0.1 siap disubmit kalau semua kebutuhan P0 lolos uji dan skenario demo berjalan end-to-end di testnet tanpa langkah manual di belakang layar.

**Metrik yang diukur saat uji**

- Waktu dari membuka link undangan sampai menjadi anggota grup.
- Waktu dari transaksi dikirim sampai tampil di feed anggota lain.

- Jumlah langkah di mana penguji non-kripto meminta bantuan (target: nol).
- Selisih antara hasil settle-up di app dan hitungan manual (target: nol).

**Kriteria rilis v0.1**

- ☐ FR-01 sampai FR-13 berfungsi di Monad testnet, termasuk settle-up otomatis
- ☐ Unit dan fuzz test kontrak lolos; scan Slither tanpa temuan serius

- ☐ Skenario tiga negara berjalan end-to-end dengan AUSD asli testnet
- ☐ Tidak ada istilah kripto di layar user

- ☐ README, video demo, dan profil project di dashboard lengkap

## Di luar scope & fase berikutnya

Fitur di bawah sengaja tidak dibangun di v0.1 supaya produk inti selesai dengan rapi sebelum deadline.

| **Fitur** | **Alasan ditunda** | **Fase** |
| --- | --- | --- |
| Persetujuan untuk setiap pemakaian | Membebani UX; cukup untuk nominal di atas batas grup | Tidak direncanakan |
| On-ramp dan off-ramp fiat (misalnya Mercuryo) | Bukan bounty; butuh integrasi mitra dan KYC | Setelah hackathon |
| Kartu sungguhan (misalnya lewat mitra issuer Visa) | Butuh mitra penerbit kartu dan KYC; di demo diganti kartu simulasi | Setelah hackathon |
| Token selain AUSD | Tidak diperlukan untuk kasus inti | Setelah hackathon |
| Mainnet | Kontrak belum diaudit | Setelah audit |

# Bagian 3 — Spesifikasi Teknis

## Stack & struktur repo

Semuanya TypeScript dalam satu monorepo: satu PWA, satu backend mini, kontrak, dan indexer, tanpa database sendiri untuk P0 karena data on-chain disimpan dan disajikan Envio.

| **Lapisan** | **Pilihan** | **Alasan** |
| --- | --- | --- |
| Frontend (PWA) | Next.js (App Router) + Serwist untuk PWA; Tailwind + shadcn/ui | Cepat dibangun, mobile-first, bisa di-install ke home screen |
| Akses chain | viem + Mera (@category-labs/mera) | Mera menangani kunci dan signing; viem mengirim transaksi dan membaca kontrak |
| Data di app | TanStack Query + graphql-request ke Envio | Cache dan refresh otomatis untuk feed dan saldo |
| Jaringan | Monad testnet (chain ID 10143) | Settlement cepat, biaya rendah |
| Uang | AUSD (Agora), 6 desimal | Syarat bounty Agora |
| Kontrak | Solidity + Foundry + OpenZeppelin | Test dan fuzz cepat untuk invariant saldo |
| Indexer | Envio HyperIndex (hosted) | Syarat bounty Envio; sudah punya database dan GraphQL sendiri |
| Backend mini | Hono (Node/TypeScript) dalam Docker, di Railway atau Fly | Penjadwal settle-up, sponsor gas/drip MON, endpoint Alchemy Webhooks |
| Gas | Alchemy Gas Manager, atau drip MON / relayer lewat backend mini | User tidak pernah memegang MON |
| Database sendiri | Tidak ada di P0; Supabase (Postgres + Storage) di P2/P3 | Hanya untuk ciphertext struk dan langganan push notification |
| Repo | Monorepo pnpm + Turborepo; paket bersama berisi ABI dan tipe | ABI dipakai bersama oleh app, backend, dan indexer |
| Hosting frontend | Vercel | Deploy dari GitHub; HTTPS otomatis (wajib untuk passkey dan PWA) |

Arsitektur aplikasi: app menandatangani lewat Mera, sponsor gas membayar gas, kontrak memindahkan AUSD, Envio menyajikan data ke app

**Pembagian tugas**

- **Frontend** memegang semua interaksi user. Transaksi ditandatangani di perangkat lewat Mera lalu dikirim langsung ke Monad.
- **Envio** adalah sumber data baca: feed, saldo tiap anggota, status pemakaian, hasil settle-up. App polling beberapa detik sekali, atau memakai subscription kalau tersedia.

- **Backend mini** hanya punya tiga tugas: memanggil settle di tanggal berakhir, membayar gas atau mengirim sedikit MON ke akun baru, dan menerima webhook Alchemy untuk push notification (P3). Kunci backend hanya untuk membayar gas; ia tidak pernah memegang dana atau kunci user.

**Kenapa backend terpisah dari Next.js API routes:** penjadwal harus berjalan tepat waktu dan terus-menerus, dan service kecil di Docker lebih bisa diandalkan untuk itu dibanding cron serverless. Alternatif paling sederhana: semua di Next.js API routes dengan penjadwal lewat GitHub Actions terjadwal.

**Alur data:** user tap di PWA → Mera menandatangani → transaksi ke kontrak di Monad → Envio menangkap event → PWA membaca GraphQL Envio → feed semua anggota diperbarui. Di tanggal berakhir, backend memanggil settle, dan hasilnya mengalir lewat jalur yang sama.

Alamat AUSD testnet yang tercatat di catatan peserta lain: 0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC. Cocokkan dulu dengan halaman contract deployments di dokumentasi Agora sebelum dipakai.

**Struktur repo**

tekosoe/
  apps/
    web/        # PWA Next.js
    api/        # backend mini Hono (Docker): penjadwal, gas, webhook
  packages/
    contracts/  # Foundry: src/, test/, script/
    indexer/    # Envio: config.yaml, schema.graphql, src/EventHandlers.ts
    shared/     # ABI, alamat kontrak, tipe bersama
  docs/         # BRD, PRD, spesifikasi, catatan keputusan
  README.md     # cara menjalankan, alamat kontrak, hash transaksi, integrasi sponsor

## Model data & state kontrak

Tekosoe adalah kas bersama: semua setoran masuk ke satu kas, dan setiap anggota boleh memakai kas sampai habis tanpa melihat berapa yang ia setor. Kontrak mencatat dua angka per anggota, total setoran (deposited) dan total bagian pemakaian (used). Saldo bersih = deposited − used, dan jumlah saldo bersih semua anggota selalu sama dengan isi kas.

**Contoh.** A, B, C masing-masing setor 100 (kas 300). A memakai 90 untuk semua, B memakai 60 untuk A dan B, C memakai 150 untuk semua. Kas 0.

| **Anggota** | **deposited** | **used** | **Saldo bersih** | **Hasil settle-up** |
| --- | --- | --- | --- | --- |
| A | 100 | 30 + 30 + 50 = 110 | −10 | Ditarik 10 |
| B | 100 | 30 + 30 + 50 = 110 | −10 | Ditarik 10 |
| C | 100 | 30 + 50 = 80 | +20 | Menerima 20 |

**Cara setiap aksi mengubah state**

| **Aksi** | **Efek** | **Uang yang berpindah** |
| --- | --- | --- |
| deposit(x) oleh A | deposited[A] += x; kas += x | x AUSD dari A ke kas |
| spend oleh A, x untuk peserta P | used[p] += bagian[p] untuk tiap p; kas −= x | x AUSD dari kas ke penerima |
| Keberatan oleh peserta p | used[p] −= bagian[p]; used[A] += bagian[p] | Tidak ada |
| settle saat tanggal berakhir | Saldo negatif ditarik dalam batas izin; saldo positif dikembalikan | AUSD dari akun anggota ke kas, lalu dari kas ke anggota |

**Struktur data (draf)**

enum GroupStatus { Active, Settled }
enum SpendStatus { Pending, Executed, Rejected }

struct Group {
    string name;
    address creator;
    bytes32 inviteHash;
    uint64 endsAt;            // tanggal grup berakhir
    uint64 disputeWindow;     // detik
    uint256 approvalThreshold; // di atas ini butuh persetujuan 1 anggota lain
    uint256 pool;             // isi kas
    GroupStatus status;
}

struct Spend {
    address spender;
    address to;               // anggota, toko demo, atau alamat lain
    uint256 amount;
    uint64 executedAt;
    SpendStatus status;
    bytes32 noteHash;
}

mapping(uint256 => Group) groups;
mapping(uint256 => address[]) members;         // maks. 10 anggota per grup
mapping(uint256 => mapping(address => uint256)) deposited;
mapping(uint256 => mapping(address => uint256)) used;
mapping(uint256 => mapping(address => uint256)) pullCap; // batas izin tarik saat settle
mapping(uint256 => Spend[]) spends;
mapping(uint256 => mapping(uint256 => mapping(address => uint256))) shareOf;
mapping(uint256 => mapping(address => uint256)) debt;    // sisa tagihan setelah settle
mapping(uint256 => mapping(address => uint256)) credit;  // sisa hak yang belum terbayar

**Batas anggota 10 per grup** membuat settle-up bisa dijalankan dalam satu transaksi dengan loop sederhana.

## Spesifikasi fungsi kontrak

Setiap fungsi yang memindahkan AUSD memakai nonReentrant dan SafeERC20, dan mengubah state sebelum transfer. Invariant: jumlah (deposited − used) semua anggota = pool = saldo AUSD grup di kontrak (sebelum settle).

| **Fungsi** | **Siapa** | **Syarat (revert kalau tidak terpenuhi)** | **Efek** | **Event** |
| --- | --- | --- | --- | --- |
| createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold) | Siapa saja | endsAt di masa depan; nilai dalam batas | Grup baru; pembuat jadi anggota | GroupCreated, MemberJoined |
| joinGroup(groupId, inviteSecret, pullCap) | Siapa saja | Grup Active; rahasia cocok; belum anggota; anggota < 10 | Jadi anggota; batas izin tarik dicatat (app sekaligus meminta approve AUSD sebesar pullCap) | MemberJoined |
| deposit(groupId, amount) | Anggota | Grup Active; amount > 0 | deposited += amount; pool += amount | Deposited |
| spend(groupId, to, amount, participants, shares, noteHash) | Anggota | Grup Active; sebelum endsAt; amount ≤ pool; peserta anggota; jumlah shares == amount | Kalau amount ≤ approvalThreshold: langsung dibayar dan used peserta naik. Kalau lebih: status Pending | SpendExecuted atau SpendRequested |
| approveSpend(groupId, spendId) | Anggota selain pemakai | Status Pending; amount ≤ pool | Dibayar; used peserta naik | SpendExecuted |
| rejectSpend(groupId, spendId) | Anggota selain pemakai | Status Pending | Status Rejected | SpendRejected |
| disputeShare(groupId, spendId) | Peserta | Status Executed; masih dalam jendela keberatan | Bagian peserta dipindah ke pemakai | ShareDisputed |
| settle(groupId) | Siapa saja (biasanya penjadwal) | Grup Active; waktu ≥ endsAt + disputeWindow | Tarik saldo negatif sampai batas izin; bayar saldo positif dari kas (proporsional kalau kas kurang); sisa dicatat sebagai debt dan credit; status Settled | Settled, Pulled, Refunded |
| payDebt(groupId, amount) | Anggota dengan debt > 0 | Grup Settled | AUSD masuk dan langsung dibagikan ke pemilik credit | DebtPaid, Refunded |

**View function untuk app:** getGroup, membersOf, balanceOf(groupId, member) (setoran, pemakaian, saldo bersih), getSpend. Feed dan riwayat diambil dari Envio.

**Batasan yang dicatat:** kekurangan hanya bisa ditarik otomatis sampai pullCap dan selama saldo AUSD anggota cukup. Sisanya menjadi tagihan (debt) yang ditampilkan jelas di app.

## Event & skema indexer Envio

App membaca daftar grup, feed, saldo, dan hasil settle-up dari Envio. Kontrak hanya dibaca langsung untuk memeriksa ulang saldo sebelum transaksi penting.

**Event kontrak**

event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold);
event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap);
event Deposited(uint256 indexed groupId, address indexed member, uint256 amount);
event SpendRequested(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount);
event SpendExecuted(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash);
event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by);
event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share);
event Settled(uint256 indexed groupId, uint256 poolBefore);
event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt);
event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit);
event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount);

**Entitas indexer (draf**** ****schema.graphql****)**

| **Entitas** | **Field utama** | **Dipakai untuk** |
| --- | --- | --- |
| Group | id, name, creator, endsAt, approvalThreshold, pool, status | Beranda, hitung mundur tanggal berakhir |
| Member | id (grup + alamat), deposited, used, net, pullCap, debt, credit | Saldo per anggota, tagihan, hasil settle-up |
| Spend | id, group, spender, to, amount, status, executedAt, noteHash | Detail pemakaian, persetujuan, keberatan |
| SpendShare | id, spend, participant, share, disputed | Rincian “untuk siapa” |
| Activity | id, group, type, actor, counterparty, amount, timestamp, txHash | Feed aktivitas (satu baris per event) |

**Aturan handler:** Member.net = deposited − used dihitung ulang di indexer dengan aturan yang sama persis seperti kontrak. Uji integrasi membandingkannya dengan balanceOf di kontrak untuk setiap anggota.

## Integrasi Mera, gas & enkripsi

Mera adalah satu-satunya sumber kunci: akun signing untuk transaksi dan kunci enkripsi untuk struk sama-sama diturunkan dari passkey yang sama, dengan salt yang berbeda.

### Mera (account layer)

- Passkey → akun EVM biasa (EOA); tidak ada kontrak smart account yang di-deploy.
- Signing session menyimpan kunci di memori selama sesi, sehingga user tidak diminta Face ID untuk setiap transaksi.

- Passkey yang tersinkron di perangkat lain menghasilkan akun yang sama.
- Nama fungsi dan cara pakai diverifikasi langsung dari source code paket dan repo contoh publik, bukan ditebak.

### Gas

| **Opsi** | **Cara kerja** | **Status** |
| --- | --- | --- |
| Alchemy Gas Manager | Sponsor gas atau bayar gas dengan AUSD lewat EIP-7702 | Diuji maks. setengah hari; kompatibilitas dengan EOA Mera belum terbukti |
| Drip MON | Backend mengirim sedikit MON ke akun baru saat onboarding | Cadangan paling sederhana |
| Relayer sendiri | Relayer membayar gas untuk transaksi yang ditandatangani user | Cadangan kalau drip tidak cukup |

Apa pun opsinya, backend hanya membayar gas; ia tidak pernah memegang kunci atau AUSD user.

### Enkripsi struk (P2, usulan desain)

- Dari passkey, turunkan kunci enkripsi pribadi dengan salt yang berbeda dari kunci signing.
- Versi pertama: catatan dan struk dienkripsi dengan kunci pribadi, jadi hanya pemiliknya yang bisa membuka.

- Versi grup: kunci grup acak dibuat saat grup dibentuk, lalu dienkripsi untuk tiap anggota memakai kunci publik enkripsi mereka.
- On-chain hanya menyimpan noteHash; ciphertext disimpan off-chain (lokasi penyimpanan belum diputuskan).

### Izin tarik untuk settle-up otomatis

- Saat bergabung, anggota memilih batas izin tarik (pullCap), misalnya 50 dolar.
- App meminta tanda tangan approve AUSD ke kontrak sebesar batas itu, dalam signing session Mera yang sama dengan joinGroup, jadi user hanya melihat satu konfirmasi.

- Di layar ditulis sebagai “Jaminan maksimal kalau kamu kurang bayar di akhir trip”.

### Penjadwal settle-up

- Kontrak tidak berjalan sendiri. Backend kecil dengan jadwal otomatis memanggil settle tepat setelah endsAt + disputeWindow.
- Backend hanya membayar gas; tidak memegang kunci atau dana. Siapa pun anggota juga bisa memanggil settle sebagai cadangan.

- Opsional, kalau P0 sudah aman: jalankan penjadwal lewat Chainlink CRE untuk bounty “Best workflow with CRE”.

### Kartu (simulasi) — P2

- Yang disimulasikan hanya jaringan kartu. Pembayarannya nyata: spend dari kas ke alamat toko demo, lengkap dengan pilihan peserta.
- App punya layar kartu virtual Tekosoe (bukan desain atau logo Visa) dan daftar toko demo dengan alamat masing-masing.

- Label “Kartu (simulasi)” tampil di app, README, dan video. Penerbitan kartu sungguhan (misalnya lewat mitra issuer Visa) ada di roadmap.

## Keamanan & konfigurasi

Ancaman terbesar ada di kontrak yang memegang dana grup dan di link undangan yang bisa disalahgunakan.

| **Ancaman** | **Mitigasi** |
| --- | --- |
| Reentrancy saat transfer AUSD | nonReentrant, state diubah sebelum transfer, SafeERC20 |
| Bukan anggota ikut bertindak | Setiap fungsi memeriksa keanggotaan |
| Satu anggota menguras kas untuk dirinya sendiri | Pemakaian di atas approvalThreshold butuh persetujuan 1 anggota lain; bagian yang dikeberatkan dipindah ke pemakai; kerugian ditarik sampai pullCap |
| Kekurangan melebihi batas izin tarik atau saldo anggota tidak cukup | Sisa dicatat sebagai debt, ditampilkan sebagai tagihan, dan dibayar lewat payDebt |
| Pembagian tidak sama dengan nominal | Revert kalau jumlah shares != amount |
| settle dipanggil terlalu cepat | Hanya setelah endsAt + disputeWindow |
| Rahasia undangan terlihat di mempool saat joinGroup | Terima risiko di v0.1 (testnet); berikutnya undangan sekali pakai |
| Kunci atau API key bocor di repo | .env di .gitignore; hanya .env.example yang di-commit |

**Konfigurasi (****.env.example****)**

MONAD_TESTNET_RPC_URL=
AUSD_ADDRESS=
GROUP_VAULT_ADDRESS=
ENVIO_GRAPHQL_URL=
ALCHEMY_API_KEY=          # opsional
ALCHEMY_GAS_POLICY_ID=    # opsional

# Bagian 4 — User Stories & Acceptance Criteria

Setiap story selesai kalau semua acceptance criteria-nya lolos di Monad testnet. Nomor FR merujuk ke PRD.

## Epic 1 — Onboarding (P0)

**US-01. Sebagai pengguna baru, saya ingin membuat akun dengan Face ID, supaya saya tidak perlu mengurus seed phrase.** (FR-01, FR-03)

- ☐ Akun jadi setelah satu kali prompt passkey
- ☐ Tidak ada layar seed phrase, extension, atau permintaan membeli token gas

- ☐ Transaksi pertama berhasil walaupun akun tidak punya MON

**US-02. Sebagai pengguna, saya ingin masuk di ponsel lain dan melihat akun yang sama.** (FR-02)

- ☐ Passkey yang sama di perangkat kedua menghasilkan alamat yang sama
- ☐ Grup dan saldo yang sama tampil di perangkat kedua

## Epic 2 — Grup (P0)

**US-03. Sebagai pembuat grup, saya ingin membuat grup dengan tanggal berakhir dan membagikan link undangan.** (FR-04, FR-05)

- ☐ Grup dibuat dengan nama, tanggal berakhir, dan batas persetujuan
- ☐ Tanggal berakhir harus di masa depan

- ☐ Link undangan bisa dibagikan lewat aplikasi chat

**US-04. Sebagai teman yang diundang, saya ingin bergabung dengan Face ID dan langsung menyetor dana.** (FR-05, FR-06)

- ☐ Dari link sampai jadi anggota hanya dengan passkey
- ☐ Saya memilih batas jaminan, dijelaskan sebagai “jaminan maksimal kalau kamu kurang bayar di akhir trip”

- ☐ Link dengan rahasia yang salah ditolak; grup maksimal 10 anggota

## Epic 3 — Kas bersama (P0)

**US-05. Sebagai anggota, saya ingin menyetor atau menambah dana ke kas kapan saja sebelum grup berakhir.** (FR-06, FR-13)

- ☐ Setoran masuk ke kas dan tercatat sebagai setoran saya
- ☐ Nominal tampil dalam dolar tanpa istilah kripto

**US-06. Sebagai anggota, saya ingin memakai kas walaupun setoran saya sudah terpakai, selama kas masih ada.** (FR-07, FR-08)

- ☐ Pemakaian berhasil selama nominal tidak melebihi isi kas, apa pun setoran saya
- ☐ Pemakaian ditolak kalau kas tidak cukup, dan app menawarkan “Tambah dana”

- ☐ Saya memilih untuk siapa: default semua anggota, bisa sebagian (misalnya A dan C saja), bagi rata atau manual
- ☐ Total pembagian harus sama dengan nominal

- ☐ Pemakaian tercatat otomatis di kontrak; tidak ada langkah pencatatan terpisah

**US-07. Sebagai anggota, saya ingin pemakaian besar disetujui anggota lain, supaya kas aman.** (FR-09)

- ☐ Pemakaian di atas batas grup menunggu persetujuan
- ☐ Satu anggota selain pemakai bisa menyetujui atau menolak

- ☐ Pemakaian yang disetujui langsung dibayar; yang ditolak tidak mengubah kas

**US-08. Sebagai anggota yang tidak ikut, saya ingin menolak bagian saya dari suatu pemakaian.** (FR-10)

- ☐ Tombol tolak hanya tersedia bagi peserta, selama jendela keberatan
- ☐ Bagian saya pindah ke pemakai, dan saldo kami berdua berubah sesuai

## Epic 4 — Settle-up otomatis (P0)

**US-09. Sebagai anggota, saya ingin semua saldo selesai otomatis di tanggal grup berakhir tanpa saya melakukan apa pun.** (FR-11)

- ☐ Settle-up berjalan otomatis setelah tanggal berakhir dan jendela keberatan terakhir
- ☐ Yang lebih bayar menerima kelebihannya langsung ke akunnya

- ☐ Yang kurang bayar ditarik otomatis sampai batas jaminannya
- ☐ Hasil akhir sama dengan hitungan manual (lihat contoh A, B, C di Spesifikasi Teknis)

**US-10. Sebagai anggota yang kurang bayar melebihi batas jaminan, saya ingin melihat dan melunasi tagihan saya.** (FR-12)

- ☐ Tagihan menampilkan nominal dan kepada siapa uang itu akan dibagikan
- ☐ Pelunasan langsung dibagikan ke anggota yang masih punya hak

## Epic 5 — Aktivitas real-time (P1)

**US-11. Sebagai anggota, saya ingin melihat aktivitas dan perkiraan hasil settle-up tanpa refresh.** (FR-14, FR-15)

- ☐ Setoran, pemakaian, persetujuan, dan penolakan muncul di feed semua anggota
- ☐ Saldo tiap anggota (setor, pakai, saldo bersih) sama dengan data kontrak

## Epic 6 — Kartu simulasi (P2)

**US-12. Sebagai anggota, saya ingin membayar di toko langsung dari kas dengan kartu Tekosoe.** (FR-16)

- ☐ Pembayaran ke toko demo memotong kas secara nyata di testnet
- ☐ Saya tetap memilih untuk siapa pembayaran itu

- ☐ Layar kartu menampilkan label “Kartu (simulasi)” dan tidak memakai logo Visa

## Epic 7 — Privasi (P2)

**US-13. Sebagai anggota, saya ingin catatan dan struk tidak bisa dibaca orang luar.** (FR-17)

- ☐ On-chain hanya menyimpan hash atau ciphertext
- ☐ Anggota grup bisa membuka catatan; alamat di luar grup tidak bisa

## Epic 8 — Notifikasi (P3)

**US-14. Sebagai anggota, saya ingin diberi tahu saat ada pemakaian baru, permintaan persetujuan, dan hasil settle-up.** (FR-18)

- ☐ Notifikasi terkirim ke anggota yang terlibat

# Bagian 5 — User Flow

App punya dua flow utama: masuk dan bergabung ke grup (termasuk setor dana dan memilih batas jaminan), lalu memakai kas bersama sampai tanggal grup berakhir, saat settle-up berjalan otomatis. Daftar layar di bagian akhir menjadi dasar wireframe.

## Flow 1 — Masuk dan bergabung ke grup

Ada dua pintu masuk, dan keduanya melewati layar Face ID yang sama: membuka app langsung, atau membuka link undangan dari teman.

Flow masuk dan bergabung ke grup

User yang datang lewat link tidak melewati Beranda; setelah Face ID ia langsung melihat konfirmasi gabung, memilih batas jaminan, dan menyetor dana awal dalam satu layar. Ini jalur tercepat dan paling penting untuk demo.

## Flow 2 — Di dalam grup

Detail grup adalah pusat app. Siapa pun bisa memakai kas selama isinya cukup; setiap pemakaian langsung tercatat di kontrak, dan pemakaian di atas batas grup menunggu persetujuan satu anggota lain.

Flow kas bersama sampai settle-up otomatis

Di tanggal berakhir, tidak ada anggota yang perlu menekan tombol: penjadwal memanggil settle-up, kelebihan dikembalikan, kekurangan ditarik sampai batas jaminan, dan sisanya jadi tagihan. Kalau kas habis sebelum tanggal berakhir, pemakaian ditolak dan app mengajak anggota menambah dana.

## Daftar layar untuk wireframe

Total 13 layar. Wireframe dikerjakan sesuai urutan prioritas: layar P0 yang muncul di demo lebih dulu, kartu simulasi (P2) terakhir.

| **No** | **Layar** | **Isi utama** | **Aksi utama** | **FR** |
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

**Status transaksi di semua layar:** tampilkan “Memproses” lalu “Selesai” dalam hitungan detik, tanpa kata hash, gas, atau blockchain.
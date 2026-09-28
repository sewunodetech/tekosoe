# Tekosoe — Spesifikasi Teknis

## Stack & struktur repo

Semuanya TypeScript dalam satu monorepo: satu app mobile Expo (iOS dan Android), satu halaman web kecil, satu backend mini, kontrak, dan indexer, plus database kecil (Supabase) untuk metadata off-chain; semua data uang tetap on-chain dan disajikan Envio.

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| App mobile | Expo (React Native, TypeScript) + Expo Router; NativeWind; build lewat EAS | App native iOS dan Android dari satu kode; memenuhi syarat "mobile app" bounty Agora |
| Akses chain | viem + Mera (`@category-labs/mera`) | Mera menangani kunci dan signing; viem mengirim transaksi dan membaca kontrak |
| Data di app | TanStack Query + graphql-request ke Envio | Cache dan refresh otomatis untuk feed dan saldo |
| Jaringan | Monad testnet (chain ID 10143) | Settlement cepat, biaya rendah |
| Uang | AUSD (Agora), 6 desimal | Syarat bounty Agora |
| Kontrak | Solidity + Foundry + OpenZeppelin | Test dan fuzz cepat untuk invariant saldo |
| Indexer | Envio HyperIndex (hosted) | Syarat bounty Envio; sudah punya database dan GraphQL sendiri |
| Backend mini | Hono (Node/TypeScript) dalam Docker, di Railway atau Fly | Penjadwal settle-up, sponsor gas/drip MON, endpoint Alchemy Webhooks |
| Gas | Alchemy Gas Manager, atau drip MON / relayer lewat backend mini | User tidak pernah memegang MON |
| Database sendiri | Supabase (Postgres + Storage) sejak P0, hanya diakses lewat backend mini | Profil, nama grup, judul dan catatan pengeluaran, struk terenkripsi, status baca, langganan push. Tidak pernah menyimpan saldo |
| Repo | Monorepo pnpm + Turborepo; paket bersama berisi ABI dan tipe | ABI dipakai bersama oleh app, backend, dan indexer |
| Distribusi app | Expo EAS | EAS Build: APK Android dan TestFlight iOS untuk juri; Expo Go untuk uji cepat tim |
| Halaman web kecil | Next.js statis di Vercel | Verifikasi invoice dari QR, link undangan yang membuka app, file asosiasi domain untuk passkey |
| Kamera, file, kripto di HP | expo-camera, expo-image-picker, expo-document-picker, expo-print; react-native-quick-crypto | Foto struk, enkripsi AES-GCM dan X25519 di HP, PDF invoice |
| Notifikasi | Expo Notifications (token disimpan di push\_subs) | Permintaan approval, nudge, invoice siap |

**Pembagian tugas**

- **Frontend** memegang semua interaksi user. Transaksi ditandatangani di perangkat lewat Mera lalu dikirim langsung ke Monad.
- **Envio** adalah sumber data baca untuk uang: feed, saldo tiap anggota, status pemakaian, hasil settle-up. App polling beberapa detik sekali, atau memakai subscription kalau tersedia.
- **Supabase** menyimpan metadata yang tidak pantas masuk blockchain: nama dan kota anggota, nama grup, judul dan catatan pengeluaran, struk terenkripsi, status baca, langganan push. App menggabungkan data Envio dan Supabase memakai `groupId` dan `spendId`.
- **Backend mini** punya empat tugas: memanggil `settle` di tanggal berakhir, membayar gas atau mengirim sedikit MON ke akun baru, menjadi satu-satunya pintu baca/tulis ke Supabase, dan mengirim push notification. Kunci backend hanya untuk gas dan DB; ia tidak pernah memegang dana atau kunci user.

**Kenapa backend terpisah dari Next.js API routes:** penjadwal harus berjalan tepat waktu dan terus-menerus, dan service kecil di Docker lebih bisa diandalkan untuk itu dibanding cron serverless. Alternatif paling sederhana: semua di Next.js API routes dengan penjadwal lewat GitHub Actions terjadwal.

**Alur data:** user tap di app → Mera menandatangani → transaksi ke kontrak di Monad → Envio menangkap event → app membaca GraphQL Envio → feed semua anggota diperbarui. Di tanggal berakhir, backend memanggil `settle`, dan hasilnya mengalir lewat jalur yang sama.

Alamat AUSD testnet yang tercatat di catatan peserta lain: `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC`. Cocokkan dulu dengan halaman contract deployments di dokumentasi Agora sebelum dipakai.

**Struktur repo**

```
tekosoe/
  apps/
    mobile/     # app Expo (React Native): Expo Router, EAS Build
    web/        # halaman kecil: verifikasi invoice, link undangan, file domain passkey
    api/        # backend mini Hono (Docker): penjadwal, gas, API metadata, push
  packages/
    contracts/  # Foundry: src/, test/, script/
    indexer/    # Envio: config.yaml, schema.graphql, src/EventHandlers.ts
    shared/     # ABI, alamat kontrak, tipe bersama, skema metadata (zod)
  supabase/     # migrasi SQL, kebijakan RLS, bucket receipts
  docs/         # BRD, PRD, spesifikasi, catatan keputusan
  README.md     # cara menjalankan, alamat kontrak, hash transaksi, integrasi sponsor
```

## Model data & state kontrak

Tekosoe adalah kas bersama: semua setoran masuk ke satu kas, dan setiap anggota boleh memakai kas sampai habis tanpa melihat berapa yang ia setor. Kontrak mencatat dua angka per anggota, total setoran (`deposited`) dan total bagian pemakaian (`used`). Saldo bersih = `deposited − used`, dan jumlah saldo bersih semua anggota selalu sama dengan isi kas.

**Contoh.** A, B, C masing-masing setor 100 (kas 300). A memakai 90 untuk semua, B memakai 60 untuk A dan B, C memakai 150 untuk semua. Kas 0.

| Anggota | `deposited` | `used` | Saldo bersih | Hasil settle-up |
| --- | --- | --- | --- | --- |
| A | 100 | 30 + 30 + 50 = 110 | −10 | Ditarik 10 |
| B | 100 | 30 + 30 + 50 = 110 | −10 | Ditarik 10 |
| C | 100 | 30 + 50 = 80 | +20 | Menerima 20 |

**Cara setiap aksi mengubah state**

| Aksi | Efek | Uang yang berpindah |
| --- | --- | --- |
| `deposit(x)` oleh A | `deposited[A] += x`; kas += x | x AUSD dari A ke kas |
| `spend` oleh A, x untuk peserta P | `used[p] += bagian[p]` untuk tiap p; kas −= x | x AUSD dari kas ke penerima |
| Keberatan oleh peserta p | `used[p] −= bagian[p]`; `used[A] += bagian[p]` | Tidak ada |
| `settle` saat tanggal berakhir | Saldo negatif ditarik dalam batas izin; saldo positif dikembalikan | AUSD dari akun anggota ke kas, lalu dari kas ke anggota |

**Struktur data (draf)**

```solidity
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
```

**Batas anggota 10 per grup** membuat settle-up bisa dijalankan dalam satu transaksi dengan loop sederhana.

## Database off-chain (Supabase)

Uang dan aturan tetap on-chain. Supabase hanya menyimpan metadata dan data pribadi yang ditampilkan app, dan setiap baris dikunci ke data on-chain lewat `groupId` dan `noteHash`. Nama, kota, dan catatan tidak boleh masuk blockchain karena publik dan permanen.

**Tabel**

| Tabel | Kolom utama | Dipakai di layar | Fase |
| --- | --- | --- | --- |
| `profiles` | `address` (PK), `display_name`, `city`, `country_code`, `avatar_color` | Home, Invite, Trip members | P0 |
| `group_meta` | `group_id` (PK), `name`, `invite_code_hash`, `created_by` | Home, Trip, Invite | P0 |
| `spend_meta` | `group_id` + `note_hash` (PK), `spend_id`, `title`, `category`, `note`, `receipt_path` | Activity, Payment details, Approval | P0 |
| `spend_reviews` | `spend_id`, `member`, `seen_at`, `decision_note` | Waiting (Seen), Declined (catatan penolak) | P1 |
| `push_subs` | `address`, `expo_push_token`, `platform` | Nudge, pengingat settle | P1 |
| `group_keys` | group\_id + member (PK), wrapped\_key, key\_version | Membuka struk (Receipt locked / unlocked) | P0 |
| `receipts` | group\_id, spend\_id, n, storage\_path, receipt\_hash, mime, attached\_by | Add receipt, tanda struk di Activity | P0 |
| `invoices` | group\_id + member (PK), number, status (paid \| refunded \| due), invoice\_hash, issued\_at | Trip invoice, See your invoice | P0 |

Storage: bucket `receipts`, path `{group_id}/{spend_id}/{n}.bin`, isinya hanya ciphertext.

**Integritas.** App menghitung `note_hash` = keccak256 dari JSON kanonik `{title, category, note, receiptHash}` sebelum memanggil `spend`, lalu mengirimnya sebagai `noteHash`. Backend menolak metadata yang hash-nya tidak cocok, dan `spend_id` diisi setelah Envio mengindeks `SpendRequested`. Kalau suatu saat isi DB tidak cocok dengan hash on-chain, app menandai pengeluaran itu "Unverified".

**Akses.**

- Frontend tidak pernah bicara langsung ke Supabase; semua lewat API backend mini.
- API meminta pesan bertanda tangan dari alamat anggota (EIP-191, ditandatangani kunci Mera) dan memeriksa keanggotaan grup on-chain sebelum membaca atau menulis.
- RLS menolak role `anon` sepenuhnya; `SUPABASE_SERVICE_ROLE_KEY` hanya ada di backend.

**Kalau DB mati.** Saldo, pemakaian, dan settle tetap tampil dari Envio. Yang hilang sementara hanya label: nama tampil sebagai alamat singkat dan judul pengeluaran sebagai "Payment".

## Spesifikasi fungsi kontrak

Setiap fungsi yang memindahkan AUSD memakai `nonReentrant` dan `SafeERC20`, dan mengubah state sebelum transfer. Invariant: jumlah (`deposited − used`) semua anggota = `pool` = saldo AUSD grup di kontrak (sebelum settle).

| Fungsi | Siapa | Syarat (revert kalau tidak terpenuhi) | Efek | Event |
| --- | --- | --- | --- | --- |
| `createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold)` | Siapa saja | `endsAt` di masa depan; nilai dalam batas | Grup baru; pembuat jadi anggota | `GroupCreated`, `MemberJoined` |
| `joinGroup(groupId, inviteSecret, pullCap)` | Siapa saja | Grup Active; rahasia cocok; belum anggota; anggota < 10 | Jadi anggota; batas izin tarik dicatat (app sekaligus meminta `approve` AUSD sebesar `pullCap`) | `MemberJoined` |
| `deposit(groupId, amount)` | Anggota | Grup Active; `amount > 0` | `deposited += amount`; `pool += amount` | `Deposited` |
| `spend(groupId, to, amount, participants, shares, noteHash)` | Anggota | Grup Active; sebelum `endsAt`; `amount ≤ pool`; peserta anggota; jumlah `shares == amount` | Kalau `amount ≤ approvalThreshold`: langsung dibayar dan `used` peserta naik. Kalau lebih: status Pending | `SpendExecuted` atau `SpendRequested` |
| `approveSpend(groupId, spendId)` | Anggota selain pemakai | Status Pending; `amount ≤ pool` | Dibayar; `used` peserta naik | `SpendExecuted` |
| `rejectSpend(groupId, spendId)` | Anggota selain pemakai | Status Pending | Status Rejected | `SpendRejected` |
| `disputeShare(groupId, spendId)` | Peserta | Status Executed; masih dalam jendela keberatan | Bagian peserta dipindah ke pemakai | `ShareDisputed` |
| `settle(groupId)` | Siapa saja (biasanya penjadwal) | Grup Active; waktu ≥ `endsAt + disputeWindow` | Tarik saldo negatif sampai batas izin; bayar saldo positif dari kas (proporsional kalau kas kurang); sisa dicatat sebagai `debt` dan `credit`; status Settled | `Settled`, `Pulled`, `Refunded` |
| `payDebt(groupId, amount)` | Anggota dengan `debt > 0` | Grup Settled | AUSD masuk dan langsung dibagikan ke pemilik `credit` | `DebtPaid`, `Refunded` |
| `attachReceipt(groupId, spendId, receiptHash)` | Pemakai (yang membayar) | Pengeluaran ada dan milik pengirim; grup belum Settled | Mencatat fingerprint struk; boleh lebih dari satu per pengeluaran; tidak memindahkan uang | `ReceiptAttached` |

**View function untuk app:** `getGroup`, `membersOf`, `balanceOf(groupId, member)` (setoran, pemakaian, saldo bersih), `getSpend`. Feed dan riwayat diambil dari Envio.

**Batasan yang dicatat:** kekurangan hanya bisa ditarik otomatis sampai `pullCap` dan selama saldo AUSD anggota cukup. Sisanya menjadi tagihan (`debt`) yang ditampilkan jelas di app.

## Event & skema indexer Envio

App membaca daftar grup, feed, saldo, dan hasil settle-up dari Envio. Kontrak hanya dibaca langsung untuk memeriksa ulang saldo sebelum transaksi penting.

**Event kontrak**

```solidity
event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold);
event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap);
event Deposited(uint256 indexed groupId, address indexed member, uint256 amount);
event SpendRequested(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount);
event SpendExecuted(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash);
event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by);
event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share);
event ReceiptAttached(uint256 indexed groupId, uint256 indexed spendId, address indexed by, bytes32 receiptHash);
event Settled(uint256 indexed groupId, uint256 poolBefore);
event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt);
event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit);
event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount);
```

**Entitas indexer (draf `schema.graphql`)**

| Entitas | Field utama | Dipakai untuk |
| --- | --- | --- |
| `Group` | id, name, creator, endsAt, approvalThreshold, pool, status | Beranda, hitung mundur tanggal berakhir |
| `Member` | id (grup + alamat), deposited, used, net, pullCap, debt, credit | Saldo per anggota, tagihan, hasil settle-up |
| `Spend` | id, group, spender, to, amount, status, executedAt, noteHash | Detail pemakaian, persetujuan, keberatan |
| `SpendShare` | id, spend, participant, share, disputed | Rincian "untuk siapa" |
| `Activity` | id, group, type, actor, counterparty, amount, timestamp, txHash | Feed aktivitas (satu baris per event) |

**Aturan handler:** `Member.net = deposited − used` dihitung ulang di indexer dengan aturan yang sama persis seperti kontrak. Uji integrasi membandingkannya dengan `balanceOf` di kontrak untuk setiap anggota.

## Integrasi Mera, gas & enkripsi

Mera adalah satu-satunya sumber kunci: akun signing untuk transaksi dan kunci enkripsi untuk struk sama-sama diturunkan dari passkey yang sama, dengan salt yang berbeda.

### Mera (account layer)

- Passkey → akun EVM biasa (EOA); tidak ada kontrak smart account yang di-deploy.
- Signing session menyimpan kunci di memori selama sesi, sehingga user tidak diminta Face ID untuk setiap transaksi.
- Passkey yang tersinkron di perangkat lain menghasilkan akun yang sama.
- Nama fungsi dan cara pakai diverifikasi langsung dari source code paket dan repo contoh publik, bukan ditebak.
- Di app Expo, passkey memakai API native (iOS lewat ASAuthorization, Android lewat Credential Manager) melalui modul passkey React Native. Keduanya butuh domain yang sama dengan `apple-app-site-association` dan `assetlinks.json`, yang dilayani `apps/web`.
- Belum dipastikan apakah SDK Mera dan ekstensi PRF berjalan di React Native. Ini di-spike pada hari pertama; cadangannya menjalankan langkah Mera di in-app browser dengan domain yang sama.

### Gas

| Opsi | Cara kerja | Status |
| --- | --- | --- |
| Alchemy Gas Manager | Sponsor gas atau bayar gas dengan AUSD lewat EIP-7702 | Diuji maks. setengah hari; kompatibilitas dengan EOA Mera belum terbukti |
| Drip MON | Backend mengirim sedikit MON ke akun baru saat onboarding | Cadangan paling sederhana |
| Relayer sendiri | Relayer membayar gas untuk transaksi yang ditandatangani user | Cadangan kalau drip tidak cukup |

Apa pun opsinya, backend hanya membayar gas; ia tidak pernah memegang kunci atau AUSD user.

### Enkripsi struk (P2, usulan desain)

1. Dari passkey, turunkan dua kunci lewat PRF Mera dengan salt berbeda: kunci signing dan pasangan kunci enkripsi X25519 milik anggota.
2. Saat grup dibuat, app pembuat membuat kunci grup acak (AES-256). Kunci ini dibungkus untuk tiap anggota memakai kunci publik X25519 mereka dan disimpan di tabel `group_keys`. Anggota baru dibungkuskan saat bergabung oleh anggota mana pun yang sedang online.
3. Struk dan catatan dienkripsi AES-GCM dengan kunci grup di HP sebelum diunggah. Server hanya menyimpan ciphertext.
4. On-chain hanya menyimpan `noteHash` dan `receiptHash`; ciphertext disimpan di Supabase Storage (bucket receipts), jadi server hanya menyimpan data yang tidak bisa ia baca.

### Struk dari penjual

Setiap pengeluaran bisa punya bukti nyata dari penjual (foto struk, e-tiket, atau PDF invoice hotel), terenkripsi dan dicap waktu on-chain.

1. Pemakai menekan "Add receipt" saat membayar, atau belakangan selama jendela keberatan masih terbuka. Bisa lebih dari satu halaman.
2. HP mengompres foto, mengenkripsinya, menghitung `receiptHash` = keccak256 dari ciphertext, lalu mengunggah ke `receipts/{group_id}/{spend_id}/{n}.bin` lewat API.
3. HP memanggil `attachReceipt(groupId, spendId, receiptHash)`. Envio mengindeks `ReceiptAttached`, sehingga struk tidak bisa diganti diam-diam.
4. Anggota lain membuka struk dengan Face ID: kunci grup dibuka di HP, ciphertext diunduh, hash-nya dicocokkan dengan data on-chain, lalu didekripsi di HP.
5. Activity menandai tiap pengeluaran "Receipt" atau "No receipt". Penyetuju pengeluaran di atas batas melihat peringatan kalau belum ada struk.
6. Pembayaran lewat kartu simulasi di demo shop menghasilkan struk digital otomatis dari toko.

P1: OCR di HP untuk membaca nominal, nama toko, dan tanggal, lalu peringatan kalau nominal struk berbeda dengan pembayaran dari pot.

### Invoice trip per anggota

Setelah `settle`, setiap anggota mendapat invoice berisi setoran, bagian tiap pengeluaran, dan cara posisi akhirnya diselesaikan. Semua angka dari Envio, label dari Supabase.

- Backend menangkap `Settled`, `Pulled`, dan `Refunded` lalu membuat satu baris `invoices` per anggota. Nomornya `INV-{trip}-{urutan}`, dan `invoice_hash` = keccak256 dari JSON kanonik invoice.
- Status: **Refunded** (menerima kembalian), **Paid** (kekurangan tertutup safety net), **Due** (masih ada `debt`). Invoice Due punya tombol "Pay $X" yang memanggil `payDebt`; begitu `DebtPaid` masuk, status berubah jadi Paid.
- Setiap baris menaut ke transaksinya di explorer Monad. Halaman verifikasi menghitung ulang invoice dari data on-chain dan mencocokkan `invoice_hash`.
- Anggota hanya bisa melihat invoice miliknya lewat permintaan bertanda tangan; link berbagi memakai token yang kedaluwarsa.

| Fitur | Fase |
| --- | --- |
| Layar invoice in-app, status Paid/Refunded/Due, tombol Pay untuk utang, tautan tiap baris ke transaksi, simpan PDF lewat expo-print | P0 |
| PDF dibuat di server, kirim lewat email | P1 |
| Perkiraan mata uang lokal dengan kurs dikunci saat settle, diberi label "approx" | P1 |

### Izin tarik untuk settle-up otomatis

- Saat bergabung, anggota memilih batas izin tarik (`pullCap`), misalnya 50 dolar.
- App meminta tanda tangan `approve` AUSD ke kontrak sebesar batas itu, dalam signing session Mera yang sama dengan `joinGroup`, jadi user hanya melihat satu konfirmasi.
- Di layar ditulis sebagai "Jaminan maksimal kalau kamu kurang bayar di akhir trip".

### Penjadwal settle-up

- Kontrak tidak berjalan sendiri. Backend kecil dengan jadwal otomatis memanggil `settle` tepat setelah `endsAt + disputeWindow`.
- Backend hanya membayar gas; tidak memegang kunci atau dana. Siapa pun anggota juga bisa memanggil `settle` sebagai cadangan.
- Opsional, kalau P0 sudah aman: jalankan penjadwal lewat Chainlink CRE untuk bounty "Best workflow with CRE".

### Kartu (simulasi) — P2

- Yang disimulasikan hanya jaringan kartu. Pembayarannya nyata: `spend` dari kas ke alamat toko demo, lengkap dengan pilihan peserta.
- App punya layar kartu virtual Tekosoe (bukan desain atau logo Visa) dan daftar toko demo dengan alamat masing-masing.
- Label "Kartu (simulasi)" tampil di app, README, dan video. Penerbitan kartu sungguhan (misalnya lewat mitra issuer Visa) ada di roadmap.

## Keamanan & konfigurasi

Ancaman terbesar ada di kontrak yang memegang dana grup dan di link undangan yang bisa disalahgunakan.

| Ancaman | Mitigasi |
| --- | --- |
| Reentrancy saat transfer AUSD | `nonReentrant`, state diubah sebelum transfer, `SafeERC20` |
| Bukan anggota ikut bertindak | Setiap fungsi memeriksa keanggotaan |
| Satu anggota menguras kas untuk dirinya sendiri | Pemakaian di atas `approvalThreshold` butuh persetujuan 1 anggota lain; bagian yang dikeberatkan dipindah ke pemakai; kerugian ditarik sampai `pullCap` |
| Kekurangan melebihi batas izin tarik atau saldo anggota tidak cukup | Sisa dicatat sebagai `debt`, ditampilkan sebagai tagihan, dan dibayar lewat `payDebt` |
| Pembagian tidak sama dengan nominal | Revert kalau jumlah `shares != amount` |
| `settle` dipanggil terlalu cepat | Hanya setelah `endsAt + disputeWindow` |
| Rahasia undangan terlihat di mempool saat `joinGroup` | Terima risiko di v0.1 (testnet); berikutnya undangan sekali pakai |
| Kunci atau API key bocor di repo | `.env` di `.gitignore`; hanya `.env.example` yang di-commit |
| Metadata di database diubah diam-diam | Hash metadata harus sama dengan noteHash on-chain; kalau berbeda, app menandai "Unverified" |
| Orang luar membaca nama, catatan, atau struk grup | API memeriksa tanda tangan alamat dan keanggotaan on-chain; RLS menolak akses anon; struk hanya disimpan sebagai ciphertext |
| Database tidak bisa diakses | Uang tetap aman di kontrak dan tampil dari Envio; hanya label nama dan judul yang hilang sementara |

**Konfigurasi (`.env.example`)**

```
# apps/mobile (Expo; hanya nilai publik)
EXPO_PUBLIC_MONAD_RPC_URL=
EXPO_PUBLIC_AUSD_ADDRESS=
EXPO_PUBLIC_GROUP_VAULT_ADDRESS=
EXPO_PUBLIC_ENVIO_GRAPHQL_URL=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_PASSKEY_DOMAIN=

# apps/api (backend, rahasia)
MONAD_TESTNET_RPC_URL=
GROUP_VAULT_ADDRESS=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=  # hanya di backend, jangan pernah di app
EXPO_ACCESS_TOKEN=          # kirim push lewat Expo
ALCHEMY_API_KEY=            # opsional
ALCHEMY_GAS_POLICY_ID=      # opsional
```

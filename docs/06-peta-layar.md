# Peta Layar

Setiap layar di canvas Final UI: apa fungsinya, dari mana user datang, ke mana tombolnya membawa, dan kontrak atau data apa yang dipakai. Nama tombol dan layar ditulis persis seperti di desain (bahasa Inggris). Jalur demo utama: 01 → 02 → 03 → 07 → 09 → S2 → 10 → S1 → 13 → I1.

## Masuk & bergabung (01–06)

Akun dibuat dengan passkey, lalu user membuat trip atau bergabung lewat link undangan.

| Layar | Fungsi | Datang dari | Lanjut ke | Kontrak & data |
| --- | --- | --- | --- | --- |
| 01 Welcome | Perkenalan produk: "One pot for the whole trip". Teko menuang ke tiga gelas, anggota dari tiga negara | Membuka app pertama kali | Get started → 02; I already have an account → 02 | — |
| 02 Sign in | Buat akun atau masuk dengan Face ID (passkey Mera). Teko mengedip | 01 | Continue with Face ID → P1 (akun baru) atau 03 (akun lama); kembali → 01 | Mera: passkey → alamat; drip gas ke akun baru |
| 03 Home | Daftar trip: kartu trip aktif (pot, saldo kamu, negara anggota), trip yang sudah settle, tips dari Teko | P1 (akun baru); 02 (akun lama); tab Trips; kembali dari 04 dan 07 | Kartu Japan Trip → 07; New trip → 04; tab Card → 12 | Envio: pot dan saldo per trip; Supabase: nama trip |
| 04 New trip | Membuat trip: nama, tanggal berakhir, batas approval, link undangan | 03; Plan another trip di 13 | Create trip → 07; Copy link / Share → 05; kembali → 03 | `createGroup`; Supabase `group_meta` |
| 05 Invite | Yang dilihat teman saat membuka link: pengundang, anggota, pot, batas approval. Teko "love" | 04; Invite more friends di S6 | Join with Face ID → 06 | Supabase `group_meta`, `profiles` |
| 06 Join + put in | Bergabung, memilih setoran awal dan safety net | 05 | Join and put in $100 → 07; kembali → 05 | `joinGroup`, `approve` AUSD sebesar safety net, `deposit` |

## Trip & pembayaran (07–12)

Layar 07 adalah pusat trip; semua aksi uang berangkat dari sini dan kembali ke sini.

| Layar | Fungsi | Datang dari | Lanjut ke | Kontrak & data |
| --- | --- | --- | --- | --- |
| 07 Trip | Pusat trip: isi pot, saldo kamu, pratinjau "If we settled today", aktivitas dengan tanda Receipt / No receipt | 03; 04; 06; kembali dari 08, 09, 11, 12, S2, S3, S4 | Add money → 08; Pay → 09; Card → 12; Dinner in Shibuya → 11; kembali → 03 | Envio: pot, saldo, feed; Supabase: judul dan status struk |
| 08 Add money | Menambah setoran ke pot. Teko "fill" dengan koin masuk | 07; S1 | Add $50 to the pot → 07; tutup → 07 | `deposit` |
| 09 Pay from pot | Membayar dari pot: nominal, penerima, untuk siapa (equal/custom), struk. Di atas batas muncul Teko "worry" | 07; S3 (Change the request); R1 (Use photo) | Add receipt photo → R1; Request approval → S2; tutup → 07 | `spend` (di atas batas jadi `SpendRequested`); `attachReceipt` |
| 10 Approval | Di HP Rina: meninjau permintaan $150, bagiannya, dan struk, lalu memutuskan. Teko "think" | S2 (tombol demo Rina's phone) | Approve → S1; Decline → S3; tutup → S2 | `approveSpend` / `rejectSpend` |
| 11 Payment details | Rincian satu pengeluaran: siapa bayar, pembagian, struk, bukti on-chain, tombol keberatan | 07 | Open (struk) → R2; I wasn't part of this → 07; kembali → 07 | `disputeShare`; Envio `SpendExecuted` |
| 12 Card (simulated) | Kartu simulasi yang belanja dari pot di toko demo | 07; tab Card di 03 | Konbini Shibuya → 07; Tokyo Taxi → S4; kembali → 07 | `spend` ke alamat toko demo (AUSD sungguhan di testnet) |

## Struk dari penjual (R1–R3)

Struk dilampirkan dari layar bayar dan dibuka dari rincian pengeluaran; isinya hanya bisa dibaca anggota trip.

| Layar | Fungsi | Datang dari | Lanjut ke | Kontrak & data |
| --- | --- | --- | --- | --- |
| R1 Add receipt | Memotret struk atau mengunggah PDF, bisa beberapa halaman; dienkripsi di HP sebelum diunggah | 09 (Add receipt photo) | Use photo → 09; Retake → R1; tutup → 09 | Supabase Storage `receipts` (ciphertext); `attachReceipt` → `ReceiptAttached` |
| R2 Receipt, locked | Struk masih terkunci: pratinjau buram, siapa yang melampirkan, fingerprint di Monad | 11 (Open) | Unlock with Face ID → R3; kembali → 11 | Supabase `receipts`, `group_keys`; Envio `ReceiptAttached` |
| R3 Receipt, unlocked | Struk terbuka di HP ini, dengan tanda bahwa fingerprint cocok dengan data on-chain | R2 | Done → 11; kembali → 11 | Dekripsi di HP dengan kunci grup (PRF Mera) |

## Settle-up & invoice (13, I1–I3)

Di tanggal berakhir penjadwal memanggil `settle`; tiap anggota lalu mendapat invoice dengan salah satu dari tiga status.

| Layar | Fungsi | Datang dari | Lanjut ke | Kontrak & data |
| --- | --- | --- | --- | --- |
| 13 Settled | Hasil settle-up: berapa yang kembali ke kamu, posisi tiap anggota, dari mana kekurangan ditutup. Confetti dan Teko "cheer" | S1 (Preview settle-up) | See your invoice → I1; Plan another trip → 04 | `settle`; Envio `Settled`, `Pulled`, `Refunded` |
| I1 Invoice · Refunded | Invoice Jack: setoran, bagian tiap pengeluaran, kembalian $20. Tiap baris menaut ke transaksi; QR untuk verifikasi | 13 | Baris → explorer Monad; Save as PDF (print browser); Share; kembali → 13 | Envio (angka), Supabase `invoices` (nomor, status, hash) |
| I2 Invoice · Due | Varian di HP Wei: safety net hanya menutup $5 dari $10, sisa $5 harus dibayar | 13 (varian) | Pay $5.00 → I3 (contoh status setelah lunas); kembali → 13 | `payDebt` → `DebtPaid`, status berubah jadi Paid |
| I3 Invoice · Paid | Invoice Rina: kurang $10, tertutup penuh oleh safety net, tidak ada yang perlu dibayar | 13; I2 setelah Pay | Save as PDF; Share; kembali → 13 | Envio `Pulled`; Supabase `invoices` |

## Kondisi khusus (S1–S6)

Layar untuk keadaan di luar jalur normal; masing-masing selalu punya jalan kembali ke Trip.

| Layar | Fungsi | Datang dari | Lanjut ke | Kontrak & data |
| --- | --- | --- | --- | --- |
| S1 Pot is empty | Pot $0 setelah tiket kereta disetujui: pembayaran dan kartu berhenti. Teko "sleep" | 10 (Approve) | Add money to the pot → 08; Preview settle-up → 13; kembali → 03 | Envio: pot = 0 |
| S2 Waiting for approval | Status permintaan $150: siapa sudah lihat, siapa belum; uang tetap di pot. Teko "think" | 09 (Request approval) | Demo: open on Rina's phone → 10; Nudge → S2; Cancel request → 07; kembali → 07 | Envio `SpendRequested`; Supabase `spend_reviews` (Seen); push |
| S3 Request declined | Wei menolak dengan catatan; tidak ada uang keluar. Teko "sad" | 10 (Decline) | Change the request → 09; Back to the trip → 07 | Envio `SpendRejected`; Supabase `spend_reviews` (catatan) |
| S4 Offline | Pembayaran taksi gagal karena offline; ditegaskan tidak ada tagihan ganda | 12 (Tokyo Taxi) | Try again → 07; Back to the card → 12 | Transaksi tidak terkirim; tidak ada perubahan on-chain |
| S5 Home · 6 people, 5 countries | Varian Home untuk grup besar: 3 avatar + "+3", teks "Indonesia · Singapore · +3 more" | Varian 03 | Baris avatar → S6; New trip → 04; tab Card → 12 | Envio `MemberJoined`; Supabase `profiles` |
| S6 Trip members | Daftar lengkap anggota dan negaranya; masih muat 4 orang lagi | S5 | Invite more friends → 05; kembali → S5 | Supabase `profiles`; batas 10 anggota di kontrak |

## Akun & profil (P1–P2)

Setelah passkey pertama dibuat, user langsung mengisi profil (P1) sebelum masuk Home. Nama, kota, dan negara yang tampil di Invite, Members, dan Home berasal dari sini.

| Layar | Fungsi | Datang dari | Lanjut ke | Kontrak & data |
| --- | --- | --- | --- | --- |
| P1 Set up profile | Sekali setelah passkey pertama dibuat: nama, kota, negara, warna avatar. Teko "wink" | 02 (Continue with Face ID, akun baru); Edit di P2 | Continue → 03; kembali → 02 | api → `profiles` (display_name, city, country_code, avatar_color) |
| P2 Profile | Tab ketiga: kartu profil + Edit, ringkasan trip, info "Signed in with Face ID", notifikasi, trip lalu, bantuan, Sign out | tab Profile di 03 / S5 | Edit → P1; Sign out → 01; tab Trips → 03; tab Card → 12 | api → `profiles`, `push_subs`; Envio (jumlah trip, total kembalian); sesi Mera (sign out = akhiri sesi) |

## Web (`apps/web`, hanya-baca, mobile-only)

Bukan bagian dari alur app. Web adalah pintu masuk publik: landing, pratinjau dashboard dengan data demo, halaman undangan, dan halaman verifikasi invoice. Aksi uang tidak dijalankan di web; tombolnya membuka sheet "buka di app". Lihat [ADR 0004](decisions/0004-web-dashboard-demo.md).

| Rute web | Setara layar app | Isi |
| --- | --- | --- |
| `/` | 01 Welcome | Landing full-bleed: navbar sticky (How it works, Good to know, Try the demo, FAQ), hero dengan tab + video, informasi penting, demo, FAQ, CTA, footer; satu-satunya halaman web di luar bingkai ponsel |
| `/get-app` | — | Halaman unduh sementara |
| `/trips` | 03 Home · S5 | Daftar trip (label "Demo preview") |
| `/trips/[id]` | 07 Trip | Kartu pot, aksi (membuka sheet), "If we settled today", Activity |
| `/trips/[id]/empty` | S1 Pot is empty | Teko tidur |
| `/trips/[id]/members` | S6 Trip members | Anggota dan negara |
| `/trips/[id]/spend/[spendId]` | 11 Payment details | Split dan baris struk |
| `/trips/[id]/settled` | 13 Settled | Ringkasan settle-up |
| `/trips/[id]/invoice/[who]` | I1–I3 | Invoice dengan QR asli, Save as PDF (cetak browser), Share |
| `/card` | 12 Card | Kartu simulasi |
| `/profile` | P2 Profile | Profil dan ringkasan |
| `/j/[code]` | 05 Invite | Buka app lewat `tekosoe://invite/<code>`, fallback "Get the app" |
| `/v/[number]` | (tujuan QR invoice) | Invoice demo, belum verifikasi nyata |

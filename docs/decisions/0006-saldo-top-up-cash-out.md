# 0006 — Saldo pribadi "Your dollars" dengan Top up dan Cash out

- Status: diterima (user, 1 Okt 2026)
- Tanggal: 2026-10-01

## Konteks

Tekosoe dipitch sebagai pembayaran lintas negara dengan on-ramp dan off-ramp (BRD: on/off-ramp fiat di roadmap). App punya dua lapisan uang: **saldo dolar pribadi** (AUSD di akun user) dan **pot trip** (GroupVault). Sebelumnya saldo pribadi hanya muncul sekilas ("From your balance of …"). Di testnet saldo itu diisi lewat tombol "Add demo funds", yang membingungkan karena berdampingan dengan "Add money" ke pot, lalu sempat diganti pengisian otomatis. Pengisian otomatis menyembunyikan lapisan saldo, padahal lapisan itulah yang membawa cerita on/off-ramp. Desain Final UI belum punya layar untuk ini.

## Keputusan

- Kartu **"Your dollars"** di **Profile** (di bawah kartu profil): saldo AUSD pribadi, tombol **Top up** (teal) dan **Cash out** (outline). Warna mengikuti token app (kartu putih, dekorasi butter + koin). Nama "Your dollars" dipakai supaya tidak bentrok dengan "Your balance" di kartu trip (saldo di dalam trip).
- **Top up** (`/balance/top-up`, modal) = simulasi on-ramp. Testnet: faucet AUSD Agora, 10.000 dolar uji per permintaan. Layar menjelaskan alur aslinya (bayar dalam mata uang sendiri → jadi dolar → masukkan ke trip).
- **Cash out** (`/balance/cash-out`, modal) = simulasi off-ramp. Testnet: AUSD sungguhan ditransfer dari akun user ke "bank" demo (`EXPO_PUBLIC_CASH_OUT_ADDRESS`, default alamat toko demo); tidak ada transfer bank sungguhan, dan layar menyatakannya.
- **Tidak ada dolar gratis otomatis** saat onboarding atau di tengah transaksi. Kalau dolar kurang, tombol utama Add money / Join berubah jadi "Top up to …" yang membuka layar Top up.

## Konsekuensi

- Tambahan layar di luar Final UI; perlu desain resmi kalau canvas diperbarui. `docs/06-peta-layar.md` sudah mencatat B1/B2.
- User baru harus Top up sekali sebelum bisa menyetor. Faucet punya cooldown global ±1 menit; pesan ramah muncul kalau sedang sibuk.
- Di mainnet, Top up/Cash out diganti mitra on/off-ramp (mis. Mercuryo); UI dan alurnya tetap.
- ABI AUSD di `@tekosoe/shared` ditambah `transfer`.

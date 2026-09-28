@AGENTS.md

## Khusus Claude Code

- Dokumen live ada di Claude Docs ("Tekosoe — Dokumen Produk", "Monad Metropolis — Dokumen Pengembangan"). Kalau user bilang dokumen berubah, baca lewat konektor Claude Docs lalu perbarui snapshot di `docs/`.
- Pakai Context7 untuk dokumentasi library sebelum menulis kode yang bergantung pada API-nya.
- Untuk pekerjaan lintas paket yang besar, kerjakan berurutan sesuai "Alur kerja agent" — jangan paralel antar lapisan yang saling bergantung.

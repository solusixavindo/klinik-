# Performance Report

## Status

- Build Next.js production berhasil.
- Demo memakai data lokal dan tidak fetch API sehingga cepat untuk calon pembeli.
- Route marketing utama statis/client ringan.

## Optimasi Yang Sudah Ada

- App Router Next.js.
- Halaman demo tanpa request database.
- API dashboard menggabungkan beberapa query dengan `Promise.all`.

## Rekomendasi Setelah Go-Live

- Pantau Vercel Speed Insights atau analytics setara.
- Tambahkan pagination untuk tabel besar.
- Tambahkan caching terkontrol untuk laporan bulanan.
- Optimasi gambar logo klinik di invoice/PDF jika ukuran upload besar.

# XaviKlinika Go-Live Report

## Status

Status source code: build production lulus, demo marketing lokal, register trial lengkap, onboarding tersedia, dan payment lama sudah diganti Xendit.

Status production akhir tetap bergantung pada ENV Vercel, SQL Supabase, storage bucket, dan webhook Xendit yang harus aktif di dashboard masing-masing layanan.

## Bug Ditemukan

- Payment masih memakai provider lama di API, billing copy, package, lockfile, dan SQL setup.
- Register belum meminta owner, WhatsApp, alamat, dan logo klinik.
- Register sukses sebelumnya diarahkan ke login, bukan wizard setup.
- Tidak ada wizard onboarding 5 langkah.
- Error global masih menyebut istilah teknis ke user.
- Dokumentasi deploy masih menyebut provider payment lama.

## Bug Diperbaiki

- Payment checkout subscription dipindah ke Xendit Invoice API.
- Webhook subscription dipindah ke callback Xendit dengan `XENDIT_WEBHOOK_TOKEN`.
- Payment booking memakai invoice Xendit.
- Dependency payment lama dihapus.
- Register sekarang menerima logo, owner, email, password, WhatsApp, alamat, dan paket.
- Register mencoba upload logo awal ke bucket `clinic-logos`.
- Register auto-login setelah sukses dan redirect ke `/onboarding`.
- Onboarding 5 langkah ditambahkan: profil, jam operasional, poli, dokter, selesai.
- Error global diganti menjadi pesan user-friendly.

## Customer Journey

- Landing root mengarahkan ke register atau demo sesuai query.
- Demo tidak melakukan fetch API dan memakai data simulasi lokal.
- Register membuat auth user, clinic, profile admin, trial event, dan optional logo.
- Onboarding dapat dilalui atau diskip.
- Dashboard production tetap memakai data real dari API/Supabase.
- Billing membuat invoice Xendit untuk upgrade paket.

## Risiko Tersisa

- Register real hanya bisa dibuktikan di Vercel jika ENV Supabase production benar.
- Xendit real hanya bisa dibuktikan jika `XENDIT_SECRET_KEY` dan webhook dashboard Xendit sudah aktif.
- SQL `supabase/full_setup.sql`, `supabase/production_ready.sql`, dan `supabase/security_hardening.sql` wajib dijalankan di Supabase production.
- Beberapa halaman dashboard masih memiliki empty state profesional untuk akun baru; ini sengaja karena production tidak boleh memakai data dummy.

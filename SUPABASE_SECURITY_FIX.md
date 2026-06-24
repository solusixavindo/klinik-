# Supabase Security Fix

Supabase mengirim email karena ada tabel `public` yang dapat diakses tanpa Row-Level Security atau ada kolom sensitif yang terekspos melalui API.

## Perbaikan

1. Buka Supabase Dashboard.
2. Pilih project `xaviklinika`.
3. Buka **SQL Editor**.
4. Jalankan isi file:

   `supabase/security_hardening.sql`

5. Setelah sukses, buka **Security Advisor** lalu klik **Run lints again**.

## Yang Dilakukan Script

- Mengaktifkan RLS untuk semua tabel aplikasi.
- Mencabut akses langsung role `anon` ke tabel public.
- Mengizinkan role `authenticated` hanya lewat policy per `clinic_id`.
- Menjaga akses server/API melalui `service_role`.
- Mengunci tabel event subscription agar write hanya dari server.

## Penting

Jangan jalankan script yang menonaktifkan RLS. File lama `disable_rls_bookings.sql` sudah dihapus karena berisiko membuka data booking ke publik.

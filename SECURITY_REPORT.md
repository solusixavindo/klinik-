# Security Report

## Yang Sudah Diperkuat

- Register memakai service role hanya di server.
- `/api/env-check` tidak membocorkan key.
- `/api/register/diagnostics` tidak membuat data.
- Payment webhook Xendit dapat divalidasi dengan `XENDIT_WEBHOOK_TOKEN`.
- API operasional utama mengambil `clinic_id` dari session via `getClinicFromRequest` atau profile user.

## Multi Tenant

- Query dashboard, booking, patients, doctors, schedules, stock, queue, lab, reports, dan subscription memakai `clinic_id` dari profile/session.
- SQL hardening tersedia di `supabase/security_hardening.sql`.

## Wajib Sebelum Iklan

- Jalankan security advisor Supabase setelah SQL hardening.
- Pastikan semua tabel public aplikasi RLS ON.
- Pastikan anon role tidak punya akses tulis bebas.
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` hanya ada di server/Vercel env, bukan client.

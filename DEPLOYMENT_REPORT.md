# Deployment Report

## ENV Wajib

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
```

## Supabase

- Jalankan `supabase/full_setup.sql`.
- Jalankan `supabase/production_ready.sql`.
- Jalankan `supabase/security_hardening.sql`.
- Pastikan bucket `clinic-logos` public dan menerima png/jpeg/webp maksimal 2MB.

## Xendit

- Buat webhook ke `/api/subscription/notification`.
- Isi callback token yang sama dengan `XENDIT_WEBHOOK_TOKEN`.
- Uji invoice sandbox/live sebelum iklan.

## Vercel

- Import GitHub repo.
- Isi ENV production.
- Redeploy.
- Cek `/api/env-check`.
- Cek `/api/register/diagnostics`.

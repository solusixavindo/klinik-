# Register Fix XaviKlinika

## ENV Wajib Di Vercel

Isi Environment Variables berikut di Vercel untuk Production:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Cara Ambil Key

Buka Supabase -> Project Settings -> API.

- `Project URL` masuk ke `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` masuk ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` masuk ke `SUPABASE_SERVICE_ROLE_KEY`

Pastikan ketiganya berasal dari project Supabase yang sama.

## Cara Cek

Setelah ENV disimpan di Vercel, lakukan redeploy lalu buka:

- `/api/env-check`
- `/api/register/diagnostics`

`/api/env-check` tidak membuat data apa pun. Endpoint ini hanya mengecek format URL, bentuk JWT, role key, dan kecocokan project ref.

`/api/register/diagnostics` tidak membuat user/data. Endpoint ini mengecek ENV dan melakukan test baca ringan ke tabel `clinics` dan `profiles` memakai service role.

## Contoh Hasil Siap

```json
{
  "NEXT_PUBLIC_SUPABASE_URL": {
    "exists": true,
    "validFormat": true,
    "projectRef": "xxxxx"
  },
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
    "exists": true,
    "looksLikeJwt": true,
    "role": "anon",
    "ref": "xxxxx"
  },
  "SUPABASE_SERVICE_ROLE_KEY": {
    "exists": true,
    "looksLikeJwt": true,
    "role": "service_role",
    "ref": "xxxxx"
  },
  "projectRefMatch": true,
  "ready": true
}
```

## Arti Error

- `NEXT_PUBLIC_SUPABASE_ANON_KEY harus berisi anon public key`: anon key salah atau tertukar.
- `SUPABASE_SERVICE_ROLE_KEY belum diisi`: service role belum dibuat di Vercel.
- `SUPABASE_SERVICE_ROLE_KEY harus berisi service_role key`: service role tertukar dengan anon key.
- `berasal dari project yang berbeda`: URL dan key bukan dari project Supabase yang sama.
- `table missing`: tabel `clinics` atau `profiles` belum ada atau schema belum diterapkan.
- `permission denied`: key bukan service role valid atau policy/permission database belum benar.
- `RLS_DENIED` atau `SCHEMA_MISMATCH` saat register: jalankan schema production yang benar, lalu redeploy.

## Flow Register

`/register` hanya POST ke `/api/register`.

`/api/register` melakukan:

1. Validasi ENV.
2. Validasi `clinicName`, `email`, `password`, dan `plan`.
3. Membuat auth user via service role.
4. Membuat clinic.
5. Membuat profile admin.
6. Mencatat trial/subscription jika tabel tersedia.
7. Rollback auth user jika clinic/profile gagal dibuat.

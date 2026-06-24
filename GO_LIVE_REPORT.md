# XaviKlinika Go Live Report

## A. Sudah Siap Jual

- `/` redirect ke `/register`.
- `/register` memakai copy trial yang ramah calon klien dan tidak menampilkan istilah teknis developer.
- `/api/register` membuat auth user, clinic, profile admin, plan, dan trial metadata jika kolom tersedia.
- `/api/self-check` tersedia untuk audit pasca-register.
- `/demo` menjadi dashboard showroom tanpa login, tanpa Supabase, tanpa API real, tanpa empty state.
- Logo klinik hidup di pengaturan, sidebar/header dashboard, dan invoice real.
- Invoice real memakai nama/logo klinik; Xavindo hanya footer kecil.
- Endpoint PDF lama `/api/generate-invoice` sekarang wajib sesi login dan memakai nama/logo klinik dari tenant.
- Webhook Midtrans wajib `signature_key` valid sebelum mengubah paket/subscription.
- API utama memakai scoping `clinic_id` dari sesi user atau dari clinic publik yang valid.

## B. Belum Siap Jual Jika Belum Dilakukan

- Environment Vercel belum lengkap.
- SQL `supabase/production_ready.sql` belum dijalankan di Supabase.
- Bucket storage `clinic-logos` belum tersedia atau policy storage belum aktif.
- Register real belum diuji menggunakan kredensial produksi.
- Logo upload belum diuji dengan file PNG/JPG/WEBP nyata di environment produksi.

## C. Risiko Tersisa

- `npm run lint` masih menghasilkan warning nonfatal `react-hooks/set-state-in-effect` di beberapa halaman dashboard lama.
- Beberapa fitur eksternal bergantung ENV tambahan: Midtrans, Fonnte, SATU SEHAT.
- `/api/self-check` sengaja dibuat untuk audit. Hapus setelah go-live jika tidak ingin endpoint audit tetap publik.
- Route publik booking memang tidak memakai token user karena dirancang untuk pasien umum.
- Route register memang publik karena dirancang membuat akun trial baru.
- Webhook Midtrans memakai `provider_reference` dan signature Midtrans sebagai boundary, bukan session user.

## D. File Yang Harus Diperhatikan

- `app/api/register/route.ts`
- `app/register/page.tsx`
- `app/api/self-check/route.ts`
- `app/api/env-check/route.ts`
- `app/api/clinic-logo/route.ts`
- `app/api/generate-invoice/route.ts`
- `app/api/subscription/notification/route.ts`
- `app/api/create-user/route.ts`
- `app/api/pengaturan/route.ts`
- `app/(dashboard)/pengaturan/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/invoice/[id]/page.tsx`
- `app/api/invoices/[id]/route.ts`
- `app/demo/page.tsx`
- `supabase/production_ready.sql`

## E. Checklist Deploy Vercel

- Set `NEXT_PUBLIC_SUPABASE_URL`.
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Set `SUPABASE_SERVICE_ROLE_KEY`.
- Redeploy production.
- Buka `/api/env-check` dan pastikan semua bernilai `true`.
- Buka `/register`, buat akun trial baru.
- Setelah login, panggil `/api/self-check` dengan token sesi dan pastikan semua bernilai `true`.

## F. Checklist Supabase

- Jalankan `supabase/production_ready.sql`.
- Pastikan RLS aktif untuk tabel real.
- Pastikan bucket `clinic-logos` ada, public, max 2MB.
- Pastikan MIME logo: `image/png`, `image/jpeg`, `image/webp`.
- Pastikan service role key di Vercel adalah secret `service_role`, bukan anon key.
- Pastikan security warning Supabase untuk public table sudah hilang atau policy sudah sesuai.

## G. Checklist Sebelum Iklan Dijalankan

- Register satu akun trial baru dari browser incognito.
- Pastikan redirect ke dashboard berhasil.
- Pastikan dashboard real kosong dan tidak berisi data demo.
- Tambahkan satu pasien dan satu dokter, pastikan tersimpan di klinik yang benar.
- Upload logo klinik di Pengaturan Klinik.
- Pastikan logo muncul di sidebar/header dashboard.
- Buat booking/invoice, pastikan invoice memakai nama dan logo klinik.
- Buka `/demo` selama 3 menit dan pastikan semua bagian terlihat hidup.
- Klik tombol demo dan pastikan muncul pesan mode demo.
- Pastikan `/api/env-check` aman dan tidak menampilkan value key asli.

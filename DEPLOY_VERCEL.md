# Deploy XaviKlinika ke Vercel

## 1. Import GitHub ke Vercel

1. Push repository XaviKlinika ke GitHub.
2. Buka Vercel Dashboard.
3. Pilih Add New Project.
4. Import repository GitHub.
5. Pastikan framework terdeteksi sebagai Next.js.

## 2. Tambahkan Environment Variables

Tambahkan minimal variable berikut di Project Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Tambahkan juga variable server-side jika fitur API terkait dipakai:

```env
SUPABASE_SERVICE_ROLE_KEY=
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
FONNTE_TOKEN=
NEXT_PUBLIC_APP_URL=
```

## 3. Redeploy

1. Buka tab Deployments.
2. Pilih deployment terbaru.
3. Klik Redeploy setelah environment variables tersimpan.

## 4. Assign Custom Domain

1. Buka Project Settings > Domains.
2. Tambahkan domain produksi.
3. Ikuti instruksi DNS Vercel.
4. Setelah domain aktif, isi `NEXT_PUBLIC_APP_URL` dengan domain produksi.

## 5. Troubleshooting Invalid API Key

Jika login atau API Supabase mengembalikan invalid API key:

1. Pastikan `NEXT_PUBLIC_SUPABASE_URL` adalah Project URL dari Supabase.
2. Pastikan `NEXT_PUBLIC_SUPABASE_ANON_KEY` adalah anon public key, bukan service role.
3. Pastikan `SUPABASE_SERVICE_ROLE_KEY` memakai secret service role key untuk API server-side.
4. Redeploy setelah mengubah variable.

## 6. Troubleshooting 404

Jika root domain menampilkan 404:

1. Pastikan `app/page.tsx` ada.
2. Pastikan Vercel mendeteksi framework Next.js.
3. Pastikan tidak ada redirect ke route yang tidak tersedia.
4. Pastikan deployment terbaru berhasil build.

Health check tersedia di `/api/health` dan harus mengembalikan:

```json
{
  "status": "ok"
}
```

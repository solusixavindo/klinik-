# Deployment Guide — XaviKlinika

## Prasyarat
- Akun Hostinger dengan Node.js support
- Domain sudah dikonfigurasi
- Supabase project aktif
- Midtrans account (opsional, ada fallback demo)

---

## Langkah 1 — Setup Database Supabase

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan file:

```
supabase/full_setup.sql
```

File ini idempotent (aman dijalankan berulang). Akan membuat/update:
- Tabel: `clinics`, `profiles`, `patients`, `doctors`, `bookings`, `schedules`
- Tabel baru: `medical_records`, `queue_entries`, `stock_items`, `bpjs_registrations`, `subscription_events`
- RLS policies untuk semua tabel

---

## Langkah 2 — Environment Variables

Set di Hostinger → **Environment Variables**:

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase (wajib) |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans (opsional) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key Midtrans (opsional) |
| `MIDTRANS_IS_PRODUCTION` | `true` untuk production |
| `FONNTE_TOKEN` | Token WhatsApp notifikasi (opsional) |

> **Penting**: `SUPABASE_SERVICE_ROLE_KEY` harus key `service_role`, bukan `anon`. Tanpa ini, fitur write ke database tidak berfungsi.

---

## Langkah 3 — Upload & Deploy ke Hostinger

```bash
# Dari folder project lokal:
npm run deploy:zip
```

Lalu upload ZIP hasil ke Hostinger via File Manager, atau gunakan FTP/SSH.

### Pengaturan Hostinger Node.js:
1. Hosting → Manage → **Advanced → Node.js**
2. Node.js version: **20.x**
3. Startup file: `server.js`
4. Run: `npm install && npm run build`

---

## Langkah 4 — Verifikasi

Setelah deploy, test alur ini:
1. `https://domain.com/register` → Daftar klinik baru dengan email & password asli
2. Login → cek dashboard muncul
3. Tambah pasien → cek tersimpan di database
4. Buat booking → cek invoice bisa digenerate
5. Cek `/laporan/harian` → data nyata dari database
6. Cek `/pelayanan/antrian-poli` → antrian bisa ditambah & diupdate
7. Cek `/operasional/stok-obat` → stok bisa ditambah
8. Cek `/pendaftaran/bpjs` → pendaftaran BPJS bisa disimpan

---

## Troubleshooting

| Problem | Solusi |
|---|---|
| Error "SERVICE_ROLE_INVALID" | Cek `SUPABASE_SERVICE_ROLE_KEY` di env vars, harus role `service_role` |
| Error 404 | Cek `.htaccess` terkonfigurasi, startup file = `server.js` |
| Build gagal | Pastikan Node.js 20+, memory minimal 512MB |
| Database tidak tersambung | Jalankan `supabase/full_setup.sql` di SQL Editor |
| Login gagal "Load failed" | Cek Supabase project tidak di-pause (free tier auto-pause) |

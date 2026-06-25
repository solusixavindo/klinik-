# Production Checklist

## Sebelum Redeploy

- [ ] ENV Supabase lengkap.
- [ ] ENV Xendit lengkap.
- [ ] SQL production dijalankan.
- [ ] Bucket logo dibuat.
- [ ] Domain production mengarah ke Vercel.

## Setelah Redeploy

- [ ] `/api/health` mengembalikan `{ "status": "ok" }`.
- [ ] `/api/env-check` mengembalikan `ready: true`.
- [ ] `/api/register/diagnostics` mengembalikan `ready: true`.
- [ ] Register trial email baru berhasil.
- [ ] Onboarding dapat diselesaikan.
- [ ] Dashboard terbuka setelah onboarding.
- [ ] Tambah pasien berhasil.
- [ ] Tambah dokter berhasil.
- [ ] Booking berhasil.
- [ ] Invoice Xendit berhasil dibuat.
- [ ] Webhook Xendit mengubah subscription menjadi active.
- [ ] Logout dan login ulang berhasil.

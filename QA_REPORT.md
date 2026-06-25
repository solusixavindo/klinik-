# QA Report

## Diuji

- `npm run build`
- Root route, register route, demo route, onboarding route, billing route secara build-time.
- Grep demo: tidak ada `fetch`, `/api`, Supabase, empty state, atau coming soon.
- Grep payment lama: tidak ada sisa nama provider payment lama di source dan dokumen.

## Skenario Lulus Dari Source

- Demo sidebar memakai state lokal dan tidak menyentuh database.
- Register POST ke `/api/register`.
- Register gagal ENV menampilkan pesan ramah.
- Register sukses mengembalikan `redirectTo: /onboarding`.
- Billing upgrade membuat invoice Xendit.
- Webhook Xendit mengaktifkan subscription saat status `PAID` atau `SETTLED`.

## Perlu Uji Production

- Register real dengan email baru.
- Upload logo ke bucket `clinic-logos`.
- Xendit invoice live/sandbox.
- Xendit webhook ke `/api/subscription/notification`.
- Login ulang setelah register.

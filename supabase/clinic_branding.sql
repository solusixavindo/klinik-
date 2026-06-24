-- XaviKlinika clinic branding support
-- Run in Supabase SQL Editor after the base schema and RLS policies are installed.

alter table public.clinics
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-logos',
  'clinic-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read clinic logos" on storage.objects;
drop policy if exists "Clinic admins upload own logo" on storage.objects;
drop policy if exists "Clinic admins update own logo" on storage.objects;
drop policy if exists "Clinic admins delete own logo" on storage.objects;

create policy "Public read clinic logos"
on storage.objects
for select
using (bucket_id = 'clinic-logos');

create policy "Clinic admins upload own logo"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'clinic-logos'
  and split_part(name, '/', 1) in (
    select clinic_id::text
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
);

create policy "Clinic admins update own logo"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'clinic-logos'
  and split_part(name, '/', 1) in (
    select clinic_id::text
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
)
with check (
  bucket_id = 'clinic-logos'
  and split_part(name, '/', 1) in (
    select clinic_id::text
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
);

create policy "Clinic admins delete own logo"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'clinic-logos'
  and split_part(name, '/', 1) in (
    select clinic_id::text
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
);

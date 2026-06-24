-- XaviKlinika — Production Ready Setup
-- Jalankan di Supabase SQL Editor setelah schema dasar tersedia.
-- Script ini idempotent: aman dijalankan ulang dan tidak menghapus data.

-- 1. Clinic branding dan trial fields
alter table public.clinics
  add column if not exists logo_url text,
  add column if not exists plan text not null default 'trial',
  add column if not exists package text,
  add column if not exists trial_plan text,
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_email text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.clinics
  drop constraint if exists clinics_plan_check,
  add constraint clinics_plan_check
    check (plan in ('trial', 'basic', 'standard', 'pro', 'premium'));

alter table public.clinics
  drop constraint if exists clinics_subscription_status_check,
  add constraint clinics_subscription_status_check
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled'));

update public.clinics
set
  plan = coalesce(nullif(plan, ''), 'trial'),
  package = coalesce(package, plan),
  trial_plan = coalesce(trial_plan, plan),
  subscription_status = coalesce(nullif(subscription_status, ''), 'trialing'),
  trial_start = coalesce(trial_start, now()),
  trial_end = coalesce(trial_end, trial_ends_at, now() + interval '14 days'),
  trial_ends_at = coalesce(trial_ends_at, trial_end, now() + interval '14 days'),
  updated_at = now()
where plan is null
   or plan = ''
   or subscription_status is null
   or subscription_status = ''
   or trial_start is null
   or trial_end is null
   or trial_ends_at is null;

-- 2. Profiles admin metadata
alter table public.profiles
  add column if not exists role text not null default 'admin',
  add column if not exists email text;

-- 3. Subscription audit events
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  event_type text not null,
  provider text not null default 'manual',
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_events_clinic_id_idx
  on public.subscription_events(clinic_id);

-- 4. Storage bucket untuk logo klinik
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

-- 5. RLS dasar multi-tenant
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "clinic_select" on public.clinics;
drop policy if exists "clinic_update" on public.clinics;
create policy "clinic_select" on public.clinics
for select
using (
  id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

create policy "clinic_update" on public.clinics
for update
using (
  id in (select clinic_id from public.profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
)
with check (
  id in (select clinic_id from public.profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);

drop policy if exists "profile_select" on public.profiles;
drop policy if exists "profile_insert" on public.profiles;
drop policy if exists "profile_update" on public.profiles;
create policy "profile_select" on public.profiles
for select
using (
  id = auth.uid()
  or clinic_id in (select clinic_id from public.profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);

create policy "profile_insert" on public.profiles
for insert
with check (id = auth.uid() or auth.role() = 'service_role');

create policy "profile_update" on public.profiles
for update
using (
  id = auth.uid()
  or clinic_id in (select clinic_id from public.profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
)
with check (
  id = auth.uid()
  or clinic_id in (select clinic_id from public.profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);

drop policy if exists "subscription_events_select" on public.subscription_events;
drop policy if exists "subscription_events_service_write" on public.subscription_events;
create policy "subscription_events_select" on public.subscription_events
for select
using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

create policy "subscription_events_service_write" on public.subscription_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- 6. Storage policies untuk logo
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

-- 7. Reload PostgREST schema cache
notify pgrst, 'reload schema';

-- Catatan:
-- Jika storage.buckets/storage.objects tidak bisa diubah dari SQL Editor project Anda,
-- buat bucket "clinic-logos" secara manual di Supabase Dashboard:
-- Public bucket, max file size 2MB, allowed MIME png/jpeg/webp.

-- XaviKlinika Supabase Security Hardening
-- Jalankan file ini di Supabase SQL Editor untuk memperbaiki warning:
-- - rls_disabled_in_public
-- - sensitive_columns_exposed
--
-- Prinsip:
-- 1. Semua tabel aplikasi public wajib RLS ON.
-- 2. Role anon tidak boleh akses langsung ke tabel aplikasi.
-- 3. User authenticated hanya boleh akses baris milik clinic_id mereka.
-- 4. Server/API tetap memakai SUPABASE_SERVICE_ROLE_KEY untuk operasi backend.

begin;

-- Pastikan role API tidak punya akses tabel langsung tanpa RLS.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Service role tetap dipakai server-side untuk API routes.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Enable RLS untuk semua tabel aplikasi yang dipakai XaviKlinika.
alter table if exists public.clinics enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.patients enable row level security;
alter table if exists public.doctors enable row level security;
alter table if exists public.schedules enable row level security;
alter table if exists public.bookings enable row level security;
alter table if exists public.medical_records enable row level security;
alter table if exists public.queue_entries enable row level security;
alter table if exists public.stock_items enable row level security;
alter table if exists public.bpjs_registrations enable row level security;
alter table if exists public.subscription_events enable row level security;
alter table if exists public.lab_requests enable row level security;
alter table if exists public.reminder_logs enable row level security;
alter table if exists public.branches enable row level security;
alter table if exists public.satusehat_queue enable row level security;
alter table if exists public.recurring_plans enable row level security;

-- Helper predicate berulang:
-- clinic_id in (select clinic_id from profiles where id = auth.uid())

-- clinics
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

-- profiles
drop policy if exists "profile_select" on public.profiles;
drop policy if exists "profile_insert" on public.profiles;
drop policy if exists "profile_update" on public.profiles;
create policy "profile_select" on public.profiles
  for select
  using (
    id = auth.uid()
    or auth.role() = 'service_role'
  );
create policy "profile_insert" on public.profiles
  for insert
  with check (
    id = auth.uid()
    or auth.role() = 'service_role'
  );
create policy "profile_update" on public.profiles
  for update
  using (
    id = auth.uid()
    or auth.role() = 'service_role'
  )
  with check (
    id = auth.uid()
    or auth.role() = 'service_role'
  );

-- Generic clinic-owned tables.
drop policy if exists "patients_all" on public.patients;
create policy "patients_all" on public.patients for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "doctors_all" on public.doctors;
create policy "doctors_all" on public.doctors for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "schedules_all" on public.schedules;
create policy "schedules_all" on public.schedules for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "bookings_all" on public.bookings;
drop policy if exists "Users can view bookings for their clinic" on public.bookings;
drop policy if exists "Users can insert bookings for their clinic" on public.bookings;
drop policy if exists "Users can update bookings for their clinic" on public.bookings;
drop policy if exists "Users can delete bookings for their clinic" on public.bookings;
create policy "bookings_all" on public.bookings for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "medical_records_all" on public.medical_records;
create policy "medical_records_all" on public.medical_records for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "queue_entries_all" on public.queue_entries;
create policy "queue_entries_all" on public.queue_entries for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "stock_items_all" on public.stock_items;
create policy "stock_items_all" on public.stock_items for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "bpjs_registrations_all" on public.bpjs_registrations;
create policy "bpjs_registrations_all" on public.bpjs_registrations for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "lab_requests_all" on public.lab_requests;
create policy "lab_requests_all" on public.lab_requests for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "reminder_logs_all" on public.reminder_logs;
create policy "reminder_logs_all" on public.reminder_logs for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "branches_all" on public.branches;
create policy "branches_all" on public.branches for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "satusehat_queue_all" on public.satusehat_queue;
create policy "satusehat_queue_all" on public.satusehat_queue for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

drop policy if exists "recurring_plans_all" on public.recurring_plans;
create policy "recurring_plans_all" on public.recurring_plans for all
  using (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role')
  with check (clinic_id in (select clinic_id from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

-- subscription_events hanya boleh ditulis server/service role.
drop policy if exists "subscription_events_all" on public.subscription_events;
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

notify pgrst, 'reload schema';

commit;

-- Audit setelah menjalankan script:
-- Tabel public yang masih belum RLS:
-- select n.nspname as schema_name, c.relname as table_name
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relkind = 'r'
--   and c.relrowsecurity = false;
--
-- Grant langsung ke anon yang masih tersisa:
-- select table_schema, table_name, privilege_type
-- from information_schema.role_table_grants
-- where grantee = 'anon'
--   and table_schema = 'public';

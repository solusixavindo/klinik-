-- ============================================================
-- XaviKlinika — Full Database Setup
-- Jalankan sekali di Supabase SQL Editor
-- Aman dijalankan berulang (idempotent)
-- ============================================================

-- ── 1. CLINICS: tambah kolom SaaS ───────────────────────────
alter table public.clinics
  add column if not exists plan text not null default 'trial',
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_email text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.clinics
  drop constraint if exists clinics_plan_check,
  add constraint clinics_plan_check
    check (plan in ('trial','basic','standard','pro','premium'));

alter table public.clinics
  drop constraint if exists clinics_subscription_status_check,
  add constraint clinics_subscription_status_check
    check (subscription_status in ('trialing','active','past_due','canceled'));

update public.clinics
set
  plan = coalesce(nullif(plan,''), 'trial'),
  subscription_status = coalesce(nullif(subscription_status,''), 'trialing'),
  trial_ends_at = coalesce(trial_ends_at, now() + interval '14 days')
where trial_ends_at is null or subscription_status = '' or plan = '';

-- ── 2. PROFILES: pastikan kolom role ada ────────────────────
alter table public.profiles
  add column if not exists role text not null default 'admin';

-- ── 3. PATIENTS: pastikan kolom lengkap ─────────────────────
alter table public.patients
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists address text,
  add column if not exists bpjs_number text,
  add column if not exists medical_record_number text;

-- ── 4. DOCTORS: pastikan kolom lengkap ──────────────────────
alter table public.doctors
  add column if not exists specialization text,
  add column if not exists phone text,
  add column if not exists license_number text;

-- ── 5. BOOKINGS: pastikan kolom lengkap ─────────────────────
alter table public.bookings
  add column if not exists payment_status text not null default 'pending',
  add column if not exists notes text,
  add column if not exists visit_type text not null default 'regular';

alter table public.bookings
  drop constraint if exists bookings_payment_status_check,
  add constraint bookings_payment_status_check
    check (payment_status in ('pending','partial','paid','cancelled'));

alter table public.bookings
  drop constraint if exists bookings_visit_type_check,
  add constraint bookings_visit_type_check
    check (visit_type in ('regular','bpjs','emergency'));

-- ── 6. MEDICAL RECORDS (rekam medis) ────────────────────────
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  visit_date date not null default current_date,
  chief_complaint text,
  diagnosis text,
  treatment text,
  prescription text,
  notes text,
  systolic_bp integer,
  diastolic_bp integer,
  heart_rate integer,
  temperature numeric(4,1),
  weight numeric(5,1),
  height numeric(5,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists medical_records_clinic_id_idx on public.medical_records(clinic_id);
create index if not exists medical_records_patient_id_idx on public.medical_records(patient_id);

-- ── 7. QUEUE ENTRIES (antrian) ───────────────────────────────
create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  queue_type text not null default 'loket',
  queue_number integer not null,
  status text not null default 'waiting',
  queue_date date not null default current_date,
  called_at timestamptz,
  served_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists queue_entries_clinic_date_idx on public.queue_entries(clinic_id, queue_date);

alter table public.queue_entries
  drop constraint if exists queue_entries_type_check,
  add constraint queue_entries_type_check
    check (queue_type in ('loket','poli','apotek'));

alter table public.queue_entries
  drop constraint if exists queue_entries_status_check,
  add constraint queue_entries_status_check
    check (status in ('waiting','called','serving','done','cancelled'));

-- ── 8. STOCK ITEMS (stok obat) ───────────────────────────────
create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  category text not null default 'obat',
  unit text not null default 'pcs',
  stock integer not null default 0,
  min_stock integer not null default 10,
  buy_price integer not null default 0,
  sell_price integer not null default 0,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stock_items_clinic_id_idx on public.stock_items(clinic_id);

-- ── 9. BPJS REGISTRATIONS ────────────────────────────────────
create table if not exists public.bpjs_registrations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  bpjs_number text not null,
  patient_name text not null,
  poli text not null,
  referral_number text,
  visit_date date not null default current_date,
  status text not null default 'registered',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists bpjs_registrations_clinic_date_idx on public.bpjs_registrations(clinic_id, visit_date);

-- ── 10. SUBSCRIPTION EVENTS ──────────────────────────────────
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  event_type text not null,
  provider text not null default 'manual',
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists subscription_events_clinic_id_idx on public.subscription_events(clinic_id);

-- ── 11. RLS — aktifkan untuk semua tabel ─────────────────────
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.bookings enable row level security;
alter table public.schedules enable row level security;
alter table public.medical_records enable row level security;
alter table public.queue_entries enable row level security;
alter table public.stock_items enable row level security;
alter table public.bpjs_registrations enable row level security;
alter table public.subscription_events enable row level security;

-- ── 12. RLS POLICIES ─────────────────────────────────────────

-- CLINICS
drop policy if exists "clinic_select" on public.clinics;
drop policy if exists "clinic_update" on public.clinics;
create policy "clinic_select" on public.clinics for select using (
  id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);
create policy "clinic_update" on public.clinics for update using (
  id in (select clinic_id from public.profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);

-- PROFILES
drop policy if exists "profile_select" on public.profiles;
drop policy if exists "profile_insert" on public.profiles;
drop policy if exists "profile_update" on public.profiles;
create policy "profile_select" on public.profiles for select using (
  id = auth.uid() or auth.role() = 'service_role'
);
create policy "profile_insert" on public.profiles for insert with check (
  id = auth.uid() or auth.role() = 'service_role'
);
create policy "profile_update" on public.profiles for update using (
  id = auth.uid() or auth.role() = 'service_role'
);

-- PATIENTS
drop policy if exists "patients_all" on public.patients;
create policy "patients_all" on public.patients for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- DOCTORS
drop policy if exists "doctors_all" on public.doctors;
create policy "doctors_all" on public.doctors for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- SCHEDULES
drop policy if exists "schedules_all" on public.schedules;
create policy "schedules_all" on public.schedules for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- BOOKINGS
drop policy if exists "bookings_all" on public.bookings;
drop policy if exists "Users can view bookings for their clinic" on public.bookings;
drop policy if exists "Users can insert bookings for their clinic" on public.bookings;
drop policy if exists "Users can update bookings for their clinic" on public.bookings;
drop policy if exists "Users can delete bookings for their clinic" on public.bookings;
create policy "bookings_all" on public.bookings for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- MEDICAL RECORDS
drop policy if exists "medical_records_all" on public.medical_records;
create policy "medical_records_all" on public.medical_records for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- QUEUE ENTRIES
drop policy if exists "queue_entries_all" on public.queue_entries;
create policy "queue_entries_all" on public.queue_entries for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- STOCK ITEMS
drop policy if exists "stock_items_all" on public.stock_items;
create policy "stock_items_all" on public.stock_items for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- BPJS REGISTRATIONS
drop policy if exists "bpjs_registrations_all" on public.bpjs_registrations;
create policy "bpjs_registrations_all" on public.bpjs_registrations for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- SUBSCRIPTION EVENTS
drop policy if exists "subscription_events_all" on public.subscription_events;
create policy "subscription_events_all" on public.subscription_events for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  auth.role() = 'service_role'
);

-- ── 13. Reload PostgREST schema ──────────────────────────────
notify pgrst, 'reload schema';

-- ── Lab Requests ──────────────────────────────────────────────────────────────
create table if not exists public.lab_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  request_date date not null default current_date,
  test_types text[] not null default '{}',
  status text not null default 'pending',
  notes text,
  result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lab_requests_clinic_date_idx on public.lab_requests(clinic_id, request_date);
alter table public.lab_requests enable row level security;
drop policy if exists "lab_requests_all" on public.lab_requests;
create policy "lab_requests_all" on public.lab_requests for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);
notify pgrst, 'reload schema';

-- Reminder Logs
create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  phone text not null,
  message text not null,
  status text not null default 'sent',
  error_message text,
  sent_at timestamptz not null default now()
);
create index if not exists reminder_logs_clinic_idx on public.reminder_logs(clinic_id, sent_at desc);
alter table public.reminder_logs enable row level security;
drop policy if exists "reminder_logs_all" on public.reminder_logs;
create policy "reminder_logs_all" on public.reminder_logs for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);
notify pgrst, 'reload schema';

-- ── Online Booking ────────────────────────────────────────────
-- Clinic public slug for online booking
alter table public.clinics add column if not exists slug text unique;
update public.clinics set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) where slug is null;

-- Toggle to enable/disable online booking per clinic
alter table public.clinics add column if not exists online_booking_enabled boolean not null default true;
notify pgrst, 'reload schema';

-- ── Multi-Branch ───────────────────────────────────────────
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  pic_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists branches_clinic_idx on public.branches(clinic_id);
alter table public.branches enable row level security;
drop policy if exists "branches_all" on public.branches;
create policy "branches_all" on public.branches for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

-- Tambah branch_id ke profiles (user bisa ditugaskan ke cabang tertentu)
alter table public.profiles add column if not exists branch_id uuid references public.branches(id) on delete set null;
notify pgrst, 'reload schema';

-- ── SATU SEHAT Integration ────────────────────────────────────
create table if not exists public.satusehat_queue (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists satusehat_queue_clinic_status_idx on public.satusehat_queue(clinic_id, status);
alter table public.satusehat_queue enable row level security;
drop policy if exists "satusehat_queue_all" on public.satusehat_queue;
create policy "satusehat_queue_all" on public.satusehat_queue for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);

alter table public.clinics
  add column if not exists satusehat_org_id text,
  add column if not exists satusehat_client_id text,
  add column if not exists satusehat_client_secret text,
  add column if not exists satusehat_enabled boolean not null default false;

notify pgrst, 'reload schema';

-- ── Recurring Billing / Auto Invoice ─────────────────────────
create table if not exists public.recurring_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  name text not null,
  amount integer not null,
  frequency text not null default 'weekly',
  day_of_week integer,
  day_of_month integer,
  visit_type text not null default 'regular',
  notes text,
  is_active boolean not null default true,
  next_due_date date,
  last_generated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists recurring_plans_clinic_active_idx on public.recurring_plans(clinic_id, is_active, next_due_date);
alter table public.recurring_plans enable row level security;
drop policy if exists "recurring_plans_all" on public.recurring_plans;
create policy "recurring_plans_all" on public.recurring_plans for all using (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
) with check (
  clinic_id in (select clinic_id from public.profiles where id = auth.uid())
  or auth.role() = 'service_role'
);
notify pgrst, 'reload schema';

-- XaviKlinika SaaS foundation.
-- Run this once in Supabase SQL Editor before enabling paid plans in production.

alter table public.clinics
  add column if not exists plan text not null default 'trial',
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_email text,
  add column if not exists midtrans_customer_id text,
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
  plan = coalesce(plan, 'trial'),
  subscription_status = coalesce(subscription_status, 'trialing'),
  trial_ends_at = coalesce(trial_ends_at, now() + interval '14 days')
where trial_ends_at is null
   or plan is null
   or subscription_status is null;

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

notify pgrst, 'reload schema';

-- =============================================================
--  KnowHow v1 — phase-3 migration: Stripe billing
--  Adds subscription tracking. Idempotent — safe to re-run.
-- =============================================================

-- 1. Plan + status enums ---------------------------------------
do $$ begin
  create type public.subscription_tier as enum ('free', 'plus', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum (
    'active', 'trialing', 'past_due', 'canceled',
    'incomplete', 'incomplete_expired', 'unpaid', 'paused'
  );
exception when duplicate_object then null; end $$;

-- 2. subscriptions ---------------------------------------------
create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  tier                   public.subscription_tier   not null default 'free',
  status                 public.subscription_status not null default 'active',
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  storage_quota_bytes    bigint  not null default 1073741824, -- 1 GB free tier
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions(stripe_customer_id);

alter table public.subscriptions enable row level security;

-- Reads: each user sees their own row. The service-role client (used by the
-- Stripe webhook) bypasses RLS.
drop policy if exists "subscriptions read own" on public.subscriptions;
create policy "subscriptions read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No public writes — all mutations go through the service-role webhook.

-- 3. Seed a row when a profile is created ----------------------
create or replace function public.handle_new_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_subscription on public.profiles;
create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_subscription();

-- Backfill rows for any existing profiles that don't have one yet.
insert into public.subscriptions (user_id)
  select p.id from public.profiles p
  left join public.subscriptions s on s.user_id = p.id
  where s.user_id is null
on conflict (user_id) do nothing;

-- 4. updated_at touch trigger ----------------------------------
create or replace function public.touch_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_subscriptions on public.subscriptions;
create trigger touch_subscriptions
  before update on public.subscriptions
  for each row execute function public.touch_subscriptions_updated_at();

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password text not null,
  profile_picture text not null default '',
  subscription text not null default 'Free' check (subscription in ('Free', 'Lite', 'Basic', 'Premium')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid', 'Paid')),
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  last_payment_amount numeric not null default 0,
  last_payment_date timestamptz,
  last_payment_method text not null default '',
  last_payment_txn_id text not null default '',
  subscription_history jsonb not null default '[]'::jsonb,
  refresh_token text not null default '',
  recurring_billing_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_subscription on public.users (subscription);
create index if not exists idx_users_payment_status on public.users (payment_status);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('visit', 'watch', 'download')),
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists idx_analytics_timestamp on public.analytics (timestamp);
create index if not exists idx_analytics_action on public.analytics (action);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

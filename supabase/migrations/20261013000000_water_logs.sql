-- Water tracking: one row each time you tap "+ 20 oz" on the Nutrition tab.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  log_date    date not null, -- your local calendar day
  ounces      smallint not null default 20 check (ounces between 1 and 128),
  created_at  timestamptz not null default now()
);

-- Makes "all the water for one day" fast.
create index water_logs_user_date_idx on public.water_logs (user_id, log_date);

-- Row Level Security: you can only ever see and change your own water logs.
alter table public.water_logs enable row level security;

create policy "Users manage their own water logs"
  on public.water_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

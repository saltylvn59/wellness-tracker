-- Weight: a weigh-in log (one per day) and a target weight on your profile.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  log_date    date not null, -- your local calendar day
  weight_lb   numeric(4, 1) not null check (weight_lb between 70 and 500),
  created_at  timestamptz not null default now(),
  -- One weigh-in per day: weighing in again just changes the number.
  unique (user_id, log_date)
);

-- Row Level Security: you can only ever see and change your own weigh-ins.
alter table public.weight_logs enable row level security;

create policy "Users manage their own weight logs"
  on public.weight_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Your goal weight, set in Settings. Empty means "no target".
alter table public.profiles
  add column target_weight_lb numeric(4, 1)
    check (target_weight_lb is null or (target_weight_lb between 70 and 500));

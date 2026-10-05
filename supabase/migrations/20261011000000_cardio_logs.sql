-- Cardio: one row per run, ride, or swim you log. Distance and time are both optional.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.cardio_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  log_date          date not null, -- your local calendar day
  kind              text not null check (kind in ('run', 'cycle', 'swim')),
  -- Distance is optional. The unit is saved with it so old entries stay correct
  -- even if the app's units ever change (miles for run/cycle, yards for swim).
  distance          numeric(9, 2) check (distance > 0 and distance <= 100000),
  distance_unit     text check (distance_unit in ('mi', 'km', 'yd', 'm')),
  -- Time in minutes is optional too.
  duration_minutes  numeric(6, 1) check (duration_minutes > 0 and duration_minutes <= 1440),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- a distance always comes with its unit
  check ((distance is null) = (distance_unit is null))
);

-- Makes "this week's cardio" fast.
create index cardio_logs_user_date_idx on public.cardio_logs (user_id, log_date);

-- Row Level Security: you can only ever see and change your own cardio logs.
alter table public.cardio_logs enable row level security;

create policy "Users manage their own cardio logs"
  on public.cardio_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Keep updated_at fresh (reuses the function from the profiles migration).
create trigger cardio_logs_set_updated_at
  before update on public.cardio_logs
  for each row execute function public.set_updated_at();

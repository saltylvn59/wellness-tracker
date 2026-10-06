-- Tanning time: one row per day (Tuesdays and Thursdays in the app), 5 to 15 minutes.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.tanning_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  log_date    date not null, -- your local calendar day
  minutes     smallint not null check (minutes between 5 and 15),
  created_at  timestamptz not null default now(),
  -- One entry per day: logging again just changes the minutes.
  unique (user_id, log_date)
);

-- Row Level Security: you can only ever see and change your own tanning logs.
alter table public.tanning_logs enable row level security;

create policy "Users manage their own tanning logs"
  on public.tanning_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

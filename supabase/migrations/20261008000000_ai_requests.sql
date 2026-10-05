-- AI usage log: one row per AI estimate request, used to enforce a daily limit
-- per person (the free AI quota is shared, so it must not be drained by one user).
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.ai_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Makes "how many requests did this user make in the last 24 hours" fast.
create index ai_requests_user_created_idx on public.ai_requests (user_id, created_at desc);

-- Row Level Security: you can read and add your own rows, and nothing else.
-- There is deliberately no update or delete policy, so the log can't be edited
-- from the browser to dodge the limit.
alter table public.ai_requests enable row level security;

create policy "Users can read their own AI requests"
  on public.ai_requests for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can log their own AI requests"
  on public.ai_requests for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

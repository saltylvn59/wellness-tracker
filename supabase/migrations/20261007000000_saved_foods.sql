-- Saved foods: your personal library of foods you eat often.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.saved_foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  calories    integer not null check (calories between 0 and 10000),
  protein_g   integer not null default 0 check (protein_g between 0 and 1000),
  carbs_g     integer not null default 0 check (carbs_g between 0 and 1000),
  fat_g       integer not null default 0 check (fat_g between 0 and 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One saved food per name per person (case-insensitive: "Banana" = "banana").
create unique index saved_foods_user_name_idx on public.saved_foods (user_id, lower(name));

-- Row Level Security: you can only ever see and change your own saved foods.
alter table public.saved_foods enable row level security;

create policy "Users can read their own saved foods"
  on public.saved_foods for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own saved foods"
  on public.saved_foods for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can edit their own saved foods"
  on public.saved_foods for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved foods"
  on public.saved_foods for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger saved_foods_set_updated_at
  before update on public.saved_foods
  for each row execute function public.set_updated_at();

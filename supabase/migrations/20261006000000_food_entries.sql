-- Milestone 3: the food log (one row per food or drink you log).
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table public.food_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- The calendar day this was eaten, as a plain date (no time zone), so daily
  -- totals and streaks line up with YOUR day, not UTC midnight.
  entry_date  date not null,
  meal_type   text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name        text not null check (char_length(name) between 1 and 200),
  calories    integer not null check (calories between 0 and 10000),
  protein_g   integer not null default 0 check (protein_g between 0 and 1000),
  carbs_g     integer not null default 0 check (carbs_g between 0 and 1000),
  fat_g       integer not null default 0 check (fat_g between 0 and 1000),
  -- How the entry was created. Later milestones add 'text' and 'photo' (AI).
  source      text not null default 'manual' check (source in ('manual', 'text', 'photo')),
  image_path  text, -- reserved for the photo feature
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Makes "all of this user's entries for one day" fast.
create index food_entries_user_date_idx on public.food_entries (user_id, entry_date);

-- Row Level Security: you can only ever see and change your own entries.
alter table public.food_entries enable row level security;

create policy "Users can read their own food entries"
  on public.food_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own food entries"
  on public.food_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can edit their own food entries"
  on public.food_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own food entries"
  on public.food_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Reuses the function from the profiles migration to keep updated_at fresh.
create trigger food_entries_set_updated_at
  before update on public.food_entries
  for each row execute function public.set_updated_at();

-- Milestone 2: user profiles (one row per signed-in user).
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

-- 1. The table. "auth.users" is Supabase's built-in table of logged-in people;
--    our profile row points at it, and is deleted automatically if the user is.
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  calorie_goal   integer check (calorie_goal is null or calorie_goal between 500 and 10000),
  protein_goal_g integer check (protein_goal_g is null or protein_goal_g between 0 and 1000),
  carb_goal_g    integer check (carb_goal_g is null or carb_goal_g between 0 and 2000),
  fat_goal_g     integer check (fat_goal_g is null or fat_goal_g between 0 and 1000),
  timezone       text not null default 'UTC', -- the app will set this from your phone later
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2. Row Level Security: the database itself enforces "you only see your own row",
--    even if there were a bug in our app code. With RLS on and no policy for an
--    action (like delete), that action is simply not allowed.
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 3. Keep updated_at fresh whenever a profile changes.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Automatically create an empty profile the first time someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

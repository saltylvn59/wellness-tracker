-- Workouts: your weekly plan, exercises, and (next step) logged sessions and sets.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

-- 1. Your week: one row per weekday (1 = Monday ... 7 = Sunday).
create table public.workout_days (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  weekday     smallint not null check (weekday between 1 and 7),
  kind        text not null check (kind in ('lift', 'cardio', 'rest')),
  title       text not null check (char_length(title) between 1 and 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, weekday)
);

-- 2. The exercises on a lifting day, with the sets and rep range YOU choose.
create table public.workout_exercises (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  day_id              uuid not null references public.workout_days (id) on delete cascade,
  position            integer not null default 0, -- order within the day
  name                text not null check (char_length(name) between 1 and 80),
  target_sets         smallint check (target_sets between 1 and 20),
  rep_min             smallint check (rep_min between 1 and 100),
  rep_max             smallint check (rep_max between 1 and 100),
  -- true = do the NEXT exercise right after this one with no rest (a superset)
  superset_with_next  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- a rep range has both ends or neither, and min can't exceed max
  check ((rep_min is null) = (rep_max is null)),
  check (rep_min is null or rep_min <= rep_max)
);
create index workout_exercises_day_idx on public.workout_exercises (day_id, position);

-- 3. A workout you actually did on a date (used by the logging step).
create table public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  session_date  date not null, -- your local calendar day
  day_id        uuid references public.workout_days (id) on delete set null,
  title         text not null check (char_length(title) between 1 and 60),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, session_date)
);

-- 4. Each set you did: weight and reps. The exercise name is copied in, so your
--    history stays readable even if you later rename or remove the exercise.
create table public.workout_sets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  session_id     uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id    uuid references public.workout_exercises (id) on delete set null,
  exercise_name  text not null check (char_length(exercise_name) between 1 and 80),
  position       integer not null default 0, -- order of the exercise in the workout
  set_number     smallint not null check (set_number between 1 and 50),
  weight         numeric(7, 2) check (weight between 0 and 2000),
  reps           smallint check (reps between 0 and 1000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index workout_sets_session_idx on public.workout_sets (session_id);
create index workout_sets_user_name_idx on public.workout_sets (user_id, lower(exercise_name));

-- Row Level Security: you can only ever see and change your own rows.
alter table public.workout_days      enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions  enable row level security;
alter table public.workout_sets      enable row level security;

create policy "Users manage their own workout days"
  on public.workout_days for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage their own workout exercises"
  on public.workout_exercises for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage their own workout sessions"
  on public.workout_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage their own workout sets"
  on public.workout_sets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Keep updated_at fresh (reuses the function from the profiles migration).
create trigger workout_days_set_updated_at
  before update on public.workout_days
  for each row execute function public.set_updated_at();
create trigger workout_exercises_set_updated_at
  before update on public.workout_exercises
  for each row execute function public.set_updated_at();
create trigger workout_sessions_set_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();
create trigger workout_sets_set_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

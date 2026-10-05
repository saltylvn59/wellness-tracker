-- Sauna (start of workout) and stretch (end of workout), logged per workout day.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- These are two new columns on the workout_sessions table you already have.
-- Existing Row Level Security still applies (you only see and change your own rows).

alter table public.workout_sessions
  -- Minutes in the sauna that day (5 to 30), or empty if you didn't log it.
  add column sauna_minutes smallint check (sauna_minutes between 5 and 30),
  -- Ticked when you finished the (10 minute) stretch session.
  add column stretch_done boolean not null default false;

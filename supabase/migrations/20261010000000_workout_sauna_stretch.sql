-- Sauna (start of workout) and stretch (end of workout), each a simple checkbox
-- worth 10 minutes, logged per workout day.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- These are two new columns on the workout_sessions table you already have.
-- Existing Row Level Security still applies (you only see and change your own rows).

alter table public.workout_sessions
  -- Ticked when you did the 10 minute sauna.
  add column sauna_done boolean not null default false,
  -- Ticked when you did the 10 minute stretch.
  add column stretch_done boolean not null default false;

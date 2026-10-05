-- Weekly cardio distance goals, stored on your profile next to your calorie and macro goals.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Everyone starts with 5 miles of running and 10 miles of cycling per week, and no
-- swimming goal. Clearing a goal in Settings stores "no goal" (empty).

alter table public.profiles
  add column weekly_run_miles numeric(6, 2) default 5
    check (weekly_run_miles is null or (weekly_run_miles > 0 and weekly_run_miles <= 500)),
  add column weekly_cycle_miles numeric(6, 2) default 10
    check (weekly_cycle_miles is null or (weekly_cycle_miles > 0 and weekly_cycle_miles <= 500)),
  add column weekly_swim_yards integer
    check (weekly_swim_yards is null or (weekly_swim_yards > 0 and weekly_swim_yards <= 100000));

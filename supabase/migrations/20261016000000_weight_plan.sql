-- Weight tab: a starting weight (Settings) and the AI's suggested weekly pace.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

alter table public.profiles
  -- Your starting weight, set in Settings. Empty means "use my first weigh-in".
  add column start_weight_lb numeric(4, 1)
    check (start_weight_lb is null or (start_weight_lb between 70 and 500)),
  -- The weekly pace (lb per week) suggested for your goal, and a one-line coaching note.
  -- The app saves these after asking the AI, so it doesn't ask again on every visit.
  add column weight_pace_lb_week numeric(3, 2)
    check (weight_pace_lb_week is null or (weight_pace_lb_week between 0.1 and 3)),
  add column weight_coach_note text
    check (weight_coach_note is null or char_length(weight_coach_note) <= 300),
  -- Where that pace came from: 'ai', or 'auto' (the built-in safe pace, when the AI was busy).
  add column weight_coach_source text
    check (weight_coach_source is null or weight_coach_source in ('ai', 'auto')),
  -- The numbers the pace was worked out for ("start|current|target"). When they change
  -- (a new weigh-in, or a new target), the app asks the AI again.
  add column weight_coach_key text
    check (weight_coach_key is null or char_length(weight_coach_key) <= 64);

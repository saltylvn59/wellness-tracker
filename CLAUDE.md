# DEVELOP (wellness tracker)

An iPhone-first web app (installable PWA) for body weight, calorie/macro tracking, lifting workouts, and cardio (run, cycle, swim). The owner is a beginner learning web development with Claude Code, so **explain what each change does and why**, and build in small steps.

## Features
- **Food log:** add food by photo or typed description; AI estimates calories and macros (always editable). Daily totals vs calorie goal.
- **Water:** a slim row on each day of the Nutrition tab: tap +20 oz per bottle (undo available); three steps at 20, 40 and 60 oz, with the third as the daily goal (60 oz). Stored one row per bottle in `water_logs`; logic in `lib/water.ts`.
- **Nutrition tab layout:** header like Fitness ("Nutrition" top-left; Today / Jump to today and the settings gear top-right), streak badge, week strip with week arrows, then a small "Weekday · date" line. The hero card focuses on calories and macros: a calorie ring (`CalorieRing`: green at/under goal, red over, "X left / X over") beside three macro rows (`MacroRow`: `eaten / goal g` with a thin bar). Optional protein/carb/fat goals are set in Settings.
- **Settings gear:** `SettingsGear` sits top-right on Weight, Fitness and Nutrition and opens the one shared Settings page.
- **Weight tab (`/weight`):** one card at the top (`WeightProgress`) shows start / current / target with a progress bar, a line chart of weigh-ins with the target line and a dashed projection (`WeightChart`, passed in as `chart`), then lb per week, weeks to go and the goal date. Below it, a compact weigh-in card: two 3-row scroll wheels (pounds 70-500, tenths) with the Save button beside them and a small Remove link in the header (`WeighInCard`; one weigh-in per day in `weight_logs`). `WheelPicker` takes optional `rows` (3 or 5) and `showLabel`. Start (optional, else the first weigh-in) and target are set in Settings (`profiles.start_weight_lb`, `profiles.target_weight_lb`). The weekly pace is suggested by Gemini (`suggestWeightPace` in `lib/ai/gemini.ts`, prompt and checks in `lib/ai/weightCoach.ts`), pulled into a safe range, and saved on the profile with the numbers it was made for (`weight_coach_key`); when a weigh-in or target changes, `PlanRefresher` asks again. If the AI is busy or over the daily limit, a built-in safe pace is used. All the math is in `lib/weightPlan.ts`; reads go through `lib/weightQueries.ts`.
- **Name and splash:** the app is called DEVELOP (subtitle "wellness tracker"). A logo + name splash shows for about a second on launch, once per browser session (`SplashScreen`, plus a tiny script in `app/layout.tsx` that sets a sessionStorage flag). iOS caches the home-screen name and icon, so after a rename delete the icon and re-add it.
- **Streaks 🔥:** Nutrition: consecutive days with at least one food entry. Fitness: consecutive days with logged lifting sets or cardio; the Sunday rest day neither breaks nor adds to it; today doesn't break it until the day is over. Shown as a badge with best streak and milestone celebrations; computed in the browser from the user's local date (`lib/streak.ts`).
- **Fitness tab (one page, driven by the week calendar):** green ring around the date on every day with a logged workout or cardio (no check mark; each day shows its 🏋️ / 🏃 / 🧘 icon). Days before today (phone clock) are dimmed, logged or not, so the days ahead stand out (`WorkoutWeekStrip`, a client component). Default weekly plan: Sunday = rest; Monday = Chest and Back; Wednesday = Legs; Friday = Delts and Arms; Tuesday, Thursday, Saturday = cardio.
  - **Your week:** a card under the streak (above the calendar) with two one-line rows of small day toggles, "Lift" and "Cardio", M T W TH F S left to right (no Sunday: it's always a recovery day, enforced on the server too). A day is green when on; turning it on in one row turns it off in the other; off in both = rest. Each tap saves by itself after a short pause (`WeekSetup`, `saveWeekKinds` in `app/(tabs)/workouts/week-actions.ts`, logic in `lib/workouts/weekSetup.ts`). It only changes `workout_days.kind` (and a generic title); exercises stay attached, so switching back restores them. Cardio and rest days are always titled "Cardio" / "Recovery Day" (`dayTitle`). Tanning stays on Tue/Thu.
  - **Lifting days:** Sauna (10 min checkbox, start of workout) and Stretch (10 min checkbox, end of workout), both on the right of their cards; the user's own editable exercise list; supersets shown as a marker between exercises, 3-5 min rest reminders; per exercise the user enters their own sets and rep range, and a Log button opens a sheet with scroll wheels for weight (2.5 lb steps) and reps; last time, today's sets, and heaviest weight show on each card; weight defaults: last used, else 100 lb, dumbbell exercises 25 lb.
  - **Cardio days:** Log run / cycle / swim, each with optional distance (miles for run and cycle, yards for swim) and time; add and delete. Weekly distance goals (Settings): run default 5 mi, cycle default 10 mi, swim no default (yards); blank = no goal. A "This week" card on cardio days shows a progress bar for each, Monday to Sunday.
  - **Tanning (Tue and Thu):** a quiet ☀️ row under the cardio section that shows "Last time: N min" until you log today; tap to pick 5-15 minutes on a scroll wheel (one entry per day, stored in `tanning_logs`). Plain text, no card, and not part of streaks or rings (`lib/tanning.ts`).
  - **#1000club (lifting days):** a card at the top (under the streak and week calendar) shows Bench, Deadlift and Squat 3-rep maxes: the heaviest weight logged for 3+ reps, matched by exercise name ("Bench" counts your Incline press sets), plus their total vs 1,000 lb (green with 🎉 once reached) (`lib/workouts/maxes.ts`, `ThreeRepMaxes`). Squat has to be added to the Wednesday plan.
- **App icon:** a flat Apple-green upward line graph of connected dots (haloed peak dot) on pure black, drawn in code (`lib/appIcon.tsx`). iPhones allow only one home-screen icon for a web app (no light/dark switching), so this dark icon is used for the home screen and all browser tabs.
- **Tabs:** three bottom tabs, left to right: Weight (`/weight`), Fitness (`/workouts`), Nutrition (`/food`). Opening the app at `/` still lands on Nutrition.

## Stack
Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (Postgres, auth, storage), Google Gemini free tier for AI food estimates (server-side only, via `lib/ai/gemini.ts`, the one swappable provider file), deployed on Vercel.

## Conventions
- Mobile-first: design for ~390px width, safe-area insets, 44px+ tap targets, 16px+ input font size (prevents iOS zoom).
- The Anthropic API key and Supabase service key live only in `.env.local` (git-ignored). Never expose them to browser code.
- Call the AI only from the server (`app/api/estimate-food/route.ts`, `app/(tabs)/weight/actions.ts`); validate the JSON reply before using it (`lib/ai/nutrition.ts`, `lib/ai/weightCoach.ts`). Both share one 40-a-day AI limit per user (`lib/ai/dailyLimit.ts`). `GEMINI_API_KEY` lives only in `.env.local` and Vercel (Sensitive).
- Row-level security on every Supabase table; every table is scoped to the signed-in user.
- Dates are stored as the user's local calendar date, not UTC timestamps, so daily totals and streaks don't break at midnight.
- Keep pure logic (streaks, goal status) in `lib/` with unit tests.
- Server actions share `lib/actionResult.ts` (the `ActionResult` type, `currentUserId`, `failedSave`); don't repeat the sign-in and error boilerplate. Those lib files use relative imports so vitest can load them.
- The Fitness page reads its data through `lib/workouts/queries.ts`: one loader per kind of day (lift, cardio, tanning), each running its queries in parallel. Add new reads there, not inline in `page.tsx`.
- Small, focused git commits with clear messages.

- This is Next.js 16 (newer than most tutorials). Check the bundled docs in `node_modules/next/dist/docs/` before using a Next.js API (see `AGENTS.md`).
- Browser-only code goes in components marked `"use client"` (see `components/`); pages in `app/` are server components by default.

## Commands
- `npm run dev`: start the local dev server
- `npm run build`: production build
- `npm test`: run unit tests (vitest; pure logic in `lib/`)

## Roadmap
0. Setup ✅ (Node, git, project folder)
1. Skeleton + PWA shell + first deploy ✅ (live at https://wellness-tracker-virid.vercel.app, verified on iPhone)
2. Auth + database ✅ (Google sign-in, profiles table + RLS, calorie-goal settings; live and verified)
3. Manual food log + daily view + date circle ✅ + Add food hub (Saved foods library) ✅ + macro goals ✅ (add/edit/delete, green/red circle, Mon-Sun week strip, vitest tests)
4. AI text estimate ✅ ("Describe your food"; Gemini free tier, 40/day per user; tries a chain of free models and falls back when one is overloaded: `lib/ai/modelChain.ts`)
5. AI photo estimate ✅ ("Take a picture"; photos resized in-browser, never stored; photo flow still to be tried on a real iPhone)
6. Streaks ✅ (Fitness and Nutrition badges, best streak, milestones, calendar rings)
7. Workouts ✅ (weekly plan; editable exercises with own sets/rep ranges; supersets and 3-5 min rest reminders; Log button with scroll wheels for weight and reps; last time, today's sets, and heaviest weight on each card; weight defaults: last used, else 100 lb, dumbbell 25 lb)
8. Cardio ✅ (run/cycle/swim with optional distance and time, under the cardio days; weekly distance goals with progress bars)
9. Nutrition redesign (calorie ring, shared settings gear) and DEVELOP rename with launch splash ✅
10. Tanning log (Tue/Thu) and weight log + target weight on cardio days ✅
11. Weight tab ✅ (three tabs: Weight, Fitness, Nutrition; inline weigh-in wheels, start/target in Settings, AI-suggested weekly pace with weeks to go, goal date and chart; weigh-in removed from cardio days)
12. Polish and real-iPhone testing (still to do: try photo logging, scroll wheels, and the checkboxes on a real iPhone)

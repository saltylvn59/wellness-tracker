# Wellness Tracker

An iPhone-first web app (installable PWA) for calorie/macro tracking, lifting workouts, and cardio (run, cycle, swim). The owner is a beginner learning web development with Claude Code, so **explain what each change does and why**, and build in small steps.

## Features
- **Food log:** add food by photo or typed description; AI estimates calories and macros (always editable). Daily totals vs calorie goal.
- **Macro goals:** optional protein/carb/fat goals; the Food tab shows each as `eaten / goal g` with a progress bar.
- **Header:** today's date in a circle: green if at/under calorie goal, red if over.
- **Streaks 🔥:** Nutrition: consecutive days with at least one food entry. Fitness: consecutive days with logged lifting sets or cardio; the Sunday rest day neither breaks nor adds to it; today doesn't break it until the day is over. Shown as a badge with best streak and milestone celebrations; computed in the browser from the user's local date (`lib/streak.ts`).
- **Fitness tab (one page, driven by the week calendar):** green ring and a check on every day with a logged workout or cardio. Weekly plan: Sunday = rest; Monday = Chest and Back; Wednesday = Legs; Friday = Delts and Arms; Tuesday, Thursday, Saturday = cardio.
  - **Lifting days:** Sauna (10 min checkbox, start of workout) and Stretch (10 min checkbox, end of workout), both on the right of their cards; the user's own editable exercise list; supersets shown as a marker between exercises, 3-5 min rest reminders; per exercise the user enters their own sets and rep range, and a Log button opens a sheet with scroll wheels for weight (2.5 lb steps) and reps; last time, today's sets, and heaviest weight show on each card; weight defaults: last used, else 100 lb, dumbbell exercises 25 lb.
  - **Cardio days:** Log run / cycle / swim, each with optional distance (miles for run and cycle, yards for swim) and time; add and delete. Weekly distance goals (Settings): run default 5 mi, cycle default 10 mi, swim no default (yards); blank = no goal. A "This week" card on cardio days shows a progress bar for each, Monday to Sunday.
- **App icon:** a flat Apple-green upward line graph of connected dots (haloed peak dot) on pure black, drawn in code (`lib/appIcon.tsx`). iPhones allow only one home-screen icon for a web app (no light/dark switching), so this dark icon is used for the home screen and all browser tabs.
- **Tabs:** two bottom tabs, Nutrition (`/food`) and Fitness (`/workouts`).

## Stack
Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (Postgres, auth, storage), Google Gemini free tier for AI food estimates (server-side only, via `lib/ai/gemini.ts`, the one swappable provider file), deployed on Vercel.

## Conventions
- Mobile-first: design for ~390px width, safe-area insets, 44px+ tap targets, 16px+ input font size (prevents iOS zoom).
- The Anthropic API key and Supabase service key live only in `.env.local` (git-ignored). Never expose them to browser code.
- Call the AI only from server routes (`app/api/estimate-food/route.ts`); validate the JSON reply before using it (`lib/ai/nutrition.ts`). `GEMINI_API_KEY` lives only in `.env.local` and Vercel (Sensitive).
- Row-level security on every Supabase table; every table is scoped to the signed-in user.
- Dates are stored as the user's local calendar date, not UTC timestamps, so daily totals and streaks don't break at midnight.
- Keep pure logic (streaks, goal status) in `lib/` with unit tests.
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
9. Polish and real-iPhone testing (still to do: try photo logging, scroll wheels, and the checkboxes on a real iPhone)

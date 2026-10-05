import { Fragment } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import GoToToday from "@/components/GoToToday";
import LogExercise from "@/components/LogExercise";
import TodayPill from "@/components/TodayPill";
import WorkoutWeekStrip from "@/components/WorkoutWeekStrip";
import { addDays, formatFullDate, formatWeekday, isoWeekday, isValidDateKey, weekDays } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import {
  connectorAfter,
  formatRest,
  formatSetsReps,
  type PlanExercise,
  type WorkoutDay,
} from "@/lib/workouts/plan";
import { latestSets, type HistoryRow } from "@/lib/workouts/history";
import { defaultRepsFor, defaultWeightFor } from "@/lib/workouts/logging";
import { ensureDefaultPlan } from "@/lib/workouts/seed";

const arrowClass =
  "flex h-11 w-11 items-center justify-center rounded-full text-2xl text-muted active:bg-card";

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  // No date in the address? Let the phone work out "today" and jump there.
  if (!date || !isValidDateKey(date)) return <GoToToday to="/workouts" />;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  const loadDays = async () =>
    ((await supabase.from("workout_days").select("id, weekday, kind, title").order("weekday")).data ??
      []) as WorkoutDay[];

  // First visit: copy the starting weekly plan into this account.
  let days = await loadDays();
  if (days.length === 0) {
    await ensureDefaultPlan(supabase, userId);
    days = await loadDays();
  }

  const week = weekDays(date);
  const byWeekday = new Map(days.map((d) => [d.weekday, d]));
  const today = byWeekday.get(isoWeekday(date));

  let exercises: PlanExercise[] = [];
  if (today?.kind === "lift") {
    const { data } = await supabase
      .from("workout_exercises")
      .select("id, name, target_sets, rep_min, rep_max, superset_with_next")
      .eq("day_id", today.id)
      .order("position", { ascending: true });
    exercises = (data ?? []) as PlanExercise[];
  }

  // Sets already logged on this date, and the sets from previous workouts ("last time").
  type TodaySet = { id: string; exercise_id: string | null; set_number: number; weight: number; reps: number };
  let todaySets: TodaySet[] = [];
  let history: HistoryRow[] = [];
  const bestById = new Map<string, number | null>();
  if (exercises.length > 0) {
    // The heaviest weight ever logged for each exercise (any date), for the quick-reference line.
    const bests = await Promise.all(
      exercises.map(async (exercise) => {
        const { data } = await supabase
          .from("workout_sets")
          .select("weight")
          .eq("exercise_id", exercise.id)
          .not("weight", "is", null)
          .order("weight", { ascending: false })
          .limit(1)
          .maybeSingle();
        return [exercise.id, data ? Number(data.weight) : null] as const;
      }),
    );
    for (const [id, best] of bests) bestById.set(id, best);

    const { data: session } = await supabase
      .from("workout_sessions")
      .select("id, workout_sets(id, exercise_id, set_number, weight, reps)")
      .eq("session_date", date)
      .maybeSingle();
    todaySets = ((session?.workout_sets ?? []) as TodaySet[]).map((s) => ({
      ...s,
      weight: Number(s.weight),
      reps: Number(s.reps),
    }));

    const { data: past } = await supabase
      .from("workout_sets")
      .select("exercise_id, set_number, weight, reps, workout_sessions!inner(session_date)")
      .in("exercise_id", exercises.map((e) => e.id))
      .lt("workout_sessions.session_date", date)
      .order("created_at", { ascending: false })
      .limit(800);
    history = (past ?? []).map((row) => {
      // The joined session comes back as one object (or a one-item list).
      const joined = row.workout_sessions as unknown as { session_date: string } | { session_date: string }[];
      const sessionDate = Array.isArray(joined) ? joined[0]?.session_date : joined?.session_date;
      return {
        exercise_id: row.exercise_id as string | null,
        session_date: sessionDate ?? "",
        set_number: row.set_number as number,
        weight: row.weight === null ? null : Number(row.weight),
        reps: row.reps === null ? null : Number(row.reps),
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <TodayPill dateKey={date} href="/workouts" />
      </div>

      <div className="flex items-center gap-1">
        <Link href={`/workouts?date=${addDays(date, -7)}`} aria-label="Previous week" className={arrowClass}>
          ‹
        </Link>
        <div className="min-w-0 flex-1">
          <WorkoutWeekStrip
            selected={date}
            days={week.map((dateKey) => ({
              dateKey,
              kind: byWeekday.get(isoWeekday(dateKey))?.kind ?? null,
            }))}
          />
        </div>
        <Link href={`/workouts?date=${addDays(date, 7)}`} aria-label="Next week" className={arrowClass}>
          ›
        </Link>
      </div>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold">
          {formatWeekday(date)}
          {today ? <span className="text-muted"> · {today.title}</span> : null}
        </h2>
        <p className="text-sm text-muted">{formatFullDate(date)}</p>
      </section>

      {!today && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          Couldn&apos;t load your plan. Please refresh.
        </p>
      )}

      {today?.kind === "rest" && (
        <section className="rounded-2xl bg-card p-6 text-center">
          <p className="text-4xl" aria-hidden="true">
            😴
          </p>
          <p className="mt-2 text-base font-semibold">Rest day</p>
          <p className="mt-1 text-sm text-muted">Recover, stretch, and sleep well.</p>
        </section>
      )}

      {today?.kind === "cardio" && (
        <section className="rounded-2xl bg-card p-6 text-center">
          <p className="text-4xl" aria-hidden="true">
            🏃
          </p>
          <p className="mt-2 text-base font-semibold">Cardio day</p>
          <p className="mt-1 text-sm text-muted">
            A run or a ride today. Logging distance and goals is coming in the Cardio tab.
          </p>
          <Link
            href="/cardio"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-base font-medium active:opacity-80"
          >
            Open Cardio
          </Link>
        </section>
      )}

      {today?.kind === "lift" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted">Today&apos;s exercises</h3>
            <Link
              href={`/workouts/plan/${today.id}?date=${date}`}
              className="flex min-h-11 items-center text-sm font-medium text-accent active:opacity-70"
            >
              Edit plan
            </Link>
          </div>

          {exercises.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              No exercises yet. Tap Edit plan to add some.
            </p>
          ) : (
            exercises.map((exercise, index) => {
              const target = formatSetsReps(exercise.target_sets, exercise.rep_min, exercise.rep_max);
              const connector = connectorAfter(exercise, index === exercises.length - 1);
              const mySets = todaySets
                .filter((set) => set.exercise_id === exercise.id)
                .sort((a, b) => a.set_number - b.set_number);
              const lastTime = latestSets(history, exercise.id);
              // The wheels start where you left off: your last set today, else last workout's first set.
              const seed = mySets.at(-1) ?? lastTime[0];
              return (
                <Fragment key={exercise.id}>
                  <LogExercise
                    exercise={{ id: exercise.id, name: exercise.name, target }}
                    date={date}
                    todaySets={mySets.map((set) => ({ id: set.id, weight: set.weight, reps: set.reps }))}
                    lastTime={lastTime}
                    bestWeight={bestById.get(exercise.id) ?? null}
                    initialWeight={defaultWeightFor(exercise.name, seed?.weight)}
                    initialReps={defaultRepsFor(exercise.rep_max, seed?.reps)}
                  />
                  {connector === "superset" && (
                    <p className="flex items-center justify-center gap-1.5 py-0.5 text-sm font-semibold text-accent">
                      <span aria-hidden="true">⚡</span> Superset · no rest
                    </p>
                  )}
                  {connector === "rest" && (
                    <p className="flex items-center justify-center gap-1.5 py-0.5 text-sm font-medium text-muted">
                      <span aria-hidden="true">⏱</span> {formatRest()}
                    </p>
                  )}
                </Fragment>
              );
            })
          )}

        </section>
      )}
    </div>
  );
}

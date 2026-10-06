import { Fragment } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CardioLogger, { type CardioLogRow } from "@/components/CardioLogger";
import ExtraCheck from "@/components/ExtraCheck";
import FitnessHeader from "@/components/FitnessHeader";
import GoToToday from "@/components/GoToToday";
import LogExercise from "@/components/LogExercise";
import ThreeRepMaxes from "@/components/ThreeRepMaxes";
import TanningLog from "@/components/TanningLog";
import WeightLog, { type LatestWeight } from "@/components/WeightLog";
import WeeklyCardioGoals from "@/components/WeeklyCardioGoals";
import { weeklyTotals, type WeeklyGoals } from "@/lib/cardioGoals";
import { addDays, formatFullDate, formatWeekday, isoWeekday, isValidDateKey, weekDays } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { isTanningDay } from "@/lib/tanning";
import {
  connectorAfter,
  formatRest,
  formatSetsReps,
  type PlanExercise,
} from "@/lib/workouts/plan";
import { loadDoneDates } from "@/lib/workouts/activity";
import { latestSets, type HistoryRow } from "@/lib/workouts/history";
import { defaultRepsFor, defaultWeightFor } from "@/lib/workouts/logging";
import { THREE_REP_MAX_LIFTS, MIN_REPS_FOR_MAX } from "@/lib/workouts/maxes";
import { loadWorkoutDays } from "@/lib/workouts/seed";

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

  // Your weekly plan (copied in on your first visit), and every day you've logged a
  // workout or cardio (for the streak and the green rings).
  const [days, doneDates] = await Promise.all([
    loadWorkoutDays(supabase, userId),
    loadDoneDates(supabase, addDays(date, -400)),
  ]);

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

  // Cardio logged on this date, plus this week's totals and your weekly goals (cardio days only).
  let cardioLogs: CardioLogRow[] = [];
  let weekTotals = { run: 0, cycle: 0, swim: 0 };
  let weeklyGoals: WeeklyGoals = { run: null, cycle: null, swim: null };
  if (today?.kind === "cardio") {
    const week = weekDays(date);
    const [{ data: weekLogs }, { data: goalsRow }] = await Promise.all([
      supabase
        .from("cardio_logs")
        .select("kind, distance, distance_unit")
        .gte("log_date", week[0])
        .lte("log_date", week[6]),
      supabase
        .from("profiles")
        .select("weekly_run_miles, weekly_cycle_miles, weekly_swim_yards")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    weekTotals = weeklyTotals(
      (weekLogs ?? []).map((row) => ({
        kind: row.kind as string,
        distance: row.distance === null ? null : Number(row.distance),
        distance_unit: row.distance_unit as string | null,
      })),
    );
    const asNumber = (value: unknown) => (value === null || value === undefined ? null : Number(value));
    weeklyGoals = {
      run: asNumber(goalsRow?.weekly_run_miles),
      cycle: asNumber(goalsRow?.weekly_cycle_miles),
      swim: asNumber(goalsRow?.weekly_swim_yards),
    };

    const { data } = await supabase
      .from("cardio_logs")
      .select("id, kind, distance, distance_unit, duration_minutes")
      .eq("log_date", date)
      .order("created_at", { ascending: true });
    cardioLogs = (data ?? []).map((row) => ({
      id: row.id as string,
      kind: row.kind as CardioLogRow["kind"],
      distance: row.distance === null ? null : Number(row.distance),
      unit: row.distance_unit as string | null,
      minutes: row.duration_minutes === null ? null : Number(row.duration_minutes),
    }));
  }

  // Weight on cardio days: your latest weigh-in (on or before this date) and your target.
  let latestWeight: LatestWeight | null = null;
  let targetWeight: number | null = null;
  if (today?.kind === "cardio") {
    const [{ data: latest }, { data: targetRow }] = await Promise.all([
      supabase
        .from("weight_logs")
        .select("log_date, weight_lb")
        .lte("log_date", date)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("target_weight_lb").eq("id", userId).maybeSingle(),
    ]);
    if (latest) latestWeight = { date: latest.log_date as string, pounds: Number(latest.weight_lb) };
    if (targetRow?.target_weight_lb != null) targetWeight = Number(targetRow.target_weight_lb);
  }

  // 3-rep maxes on lifting days: for each lift, the heaviest weight logged for 3+ reps (any date).
  let threeRepMaxes: (number | null)[] = [];
  if (today?.kind === "lift") {
    threeRepMaxes = await Promise.all(
      THREE_REP_MAX_LIFTS.map(async (lift) => {
        const { data } = await supabase
          .from("workout_sets")
          .select("weight")
          .ilike("exercise_name", lift.exerciseName) // no wildcards: same name, any capitalization
          .gte("reps", MIN_REPS_FOR_MAX)
          .not("weight", "is", null)
          .order("weight", { ascending: false })
          .limit(1)
          .maybeSingle();
        return data ? Number(data.weight) : null;
      }),
    );
  }

  // Tuesday and Thursday also have a quiet tanning log: the minutes saved for this date, if any,
  // and the most recent earlier session so you can remember what you did last time.
  const showTanning = isTanningDay(isoWeekday(date));
  let tanningMinutes: number | null = null;
  let lastTanningMinutes: number | null = null;
  if (showTanning) {
    const [{ data: tan }, { data: previous }] = await Promise.all([
      supabase.from("tanning_logs").select("minutes").eq("log_date", date).maybeSingle(),
      supabase
        .from("tanning_logs")
        .select("minutes")
        .lt("log_date", date)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    tanningMinutes = tan ? Number(tan.minutes) : null;
    lastTanningMinutes = previous ? Number(previous.minutes) : null;
  }

  // Whether today's sauna and stretch are ticked (lifting days only).
  let saunaDone = false;
  let stretchDone = false;
  if (today?.kind === "lift") {
    const { data: extras } = await supabase
      .from("workout_sessions")
      .select("sauna_done, stretch_done")
      .eq("session_date", date)
      .maybeSingle();
    saunaDone = Boolean(extras?.sauna_done);
    stretchDone = Boolean(extras?.stretch_done);
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
      <FitnessHeader date={date} days={days} doneDates={doneDates} />

      {today?.kind === "cardio" && (
        <WeightLog key={date} date={date} latest={latestWeight} target={targetWeight} />
      )}
      {today?.kind === "lift" && <ThreeRepMaxes maxes={threeRepMaxes} />}

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
        <>
          <CardioLogger date={date} logs={cardioLogs} />
          <WeeklyCardioGoals totals={weekTotals} goals={weeklyGoals} />
        </>
      )}

      {showTanning && <TanningLog key={date} date={date} minutes={tanningMinutes} lastMinutes={lastTanningMinutes} />}

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

          <ExtraCheck kind="sauna" date={date} dayId={today.id} done={saunaDone} />

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

          <ExtraCheck kind="stretch" date={date} dayId={today.id} done={stretchDone} />
        </section>
      )}
    </div>
  );
}

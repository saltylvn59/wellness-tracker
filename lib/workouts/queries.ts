import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardioLogRow } from "../cardio";
import { weeklyTotals, type WeeklyGoals } from "../cardioGoals";
import { weekDays } from "../dates";
import type { HistoryRow } from "./history";
import { MIN_REPS_FOR_MAX, THREE_REP_MAX_LIFTS } from "./maxes";
import type { PlanExercise } from "./plan";

// The database reads behind the Fitness page, one function per kind of day. Each one runs
// its queries at the same time (not one after another), so the page loads faster.
// Row Level Security means every query only ever sees YOUR rows.

const asNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

export type TodaySet = { id: string; exercise_id: string | null; set_number: number; weight: number; reps: number };

export type LiftDayData = {
  exercises: PlanExercise[];
  saunaDone: boolean;
  stretchDone: boolean;
  todaySets: TodaySet[]; // sets already logged on this date
  history: HistoryRow[]; // sets from earlier workouts ("last time")
  bestById: Map<string, number | null>; // heaviest weight ever logged for each exercise
  threeRepMaxes: (number | null)[]; // in the order of THREE_REP_MAX_LIFTS
};

export async function loadLiftDay(supabase: SupabaseClient, date: string, dayId: string): Promise<LiftDayData> {
  const [exercisesResult, sessionResult, threeRepMaxes] = await Promise.all([
    supabase
      .from("workout_exercises")
      .select("id, name, target_sets, rep_min, rep_max, superset_with_next")
      .eq("day_id", dayId)
      .order("position", { ascending: true }),
    // Today's session: the sauna and stretch ticks, plus every set logged so far.
    supabase
      .from("workout_sessions")
      .select("sauna_done, stretch_done, workout_sets(id, exercise_id, set_number, weight, reps)")
      .eq("session_date", date)
      .maybeSingle(),
    // For each 3-rep max lift: the heaviest weight logged for 3+ reps (any date).
    Promise.all(
      THREE_REP_MAX_LIFTS.map(async (lift) => {
        const { data } = await supabase
          .from("workout_sets")
          .select("weight")
          // Same name (no wildcards), any capitalization, singular or plural.
          .or(lift.exerciseNames.map((name) => `exercise_name.ilike.${name}`).join(","))
          .gte("reps", MIN_REPS_FOR_MAX)
          .not("weight", "is", null)
          .order("weight", { ascending: false })
          .limit(1)
          .maybeSingle();
        return data ? Number(data.weight) : null;
      }),
    ),
  ]);

  const exercises = (exercisesResult.data ?? []) as PlanExercise[];
  const session = sessionResult.data;
  const todaySets = ((session?.workout_sets ?? []) as TodaySet[]).map((set) => ({
    ...set,
    weight: Number(set.weight),
    reps: Number(set.reps),
  }));

  const bestById = new Map<string, number | null>();
  let history: HistoryRow[] = [];
  if (exercises.length > 0) {
    const [bests, past] = await Promise.all([
      // The heaviest weight ever logged for each exercise (any date), for the quick-reference line.
      Promise.all(
        exercises.map(async (exercise) => {
          const { data } = await supabase
            .from("workout_sets")
            .select("weight")
            .eq("exercise_id", exercise.id)
            .not("weight", "is", null)
            .order("weight", { ascending: false })
            .limit(1)
            .maybeSingle();
          return [exercise.id, asNumber(data?.weight)] as const;
        }),
      ),
      // Sets from earlier workouts, for each exercise's "last time".
      supabase
        .from("workout_sets")
        .select("exercise_id, set_number, weight, reps, workout_sessions!inner(session_date)")
        .in("exercise_id", exercises.map((e) => e.id))
        .lt("workout_sessions.session_date", date)
        .order("created_at", { ascending: false })
        .limit(800),
    ]);
    for (const [id, best] of bests) bestById.set(id, best);
    history = (past.data ?? []).map((row) => {
      // The joined session comes back as one object (or a one-item list).
      const joined = row.workout_sessions as unknown as { session_date: string } | { session_date: string }[];
      const sessionDate = Array.isArray(joined) ? joined[0]?.session_date : joined?.session_date;
      return {
        exercise_id: row.exercise_id as string | null,
        session_date: sessionDate ?? "",
        set_number: row.set_number as number,
        weight: asNumber(row.weight),
        reps: asNumber(row.reps),
      };
    });
  }

  return {
    exercises,
    saunaDone: Boolean(session?.sauna_done),
    stretchDone: Boolean(session?.stretch_done),
    todaySets,
    history,
    bestById,
    threeRepMaxes,
  };
}

export type CardioDayData = {
  logs: CardioLogRow[]; // cardio logged on this date
  weekTotals: ReturnType<typeof weeklyTotals>;
  weeklyGoals: WeeklyGoals;
};

export async function loadCardioDay(supabase: SupabaseClient, userId: string, date: string): Promise<CardioDayData> {
  const week = weekDays(date);
  const [weekLogs, profile, dayLogs] = await Promise.all([
    supabase.from("cardio_logs").select("kind, distance, distance_unit").gte("log_date", week[0]).lte("log_date", week[6]),
    supabase
      .from("profiles")
      .select("weekly_run_miles, weekly_cycle_miles, weekly_swim_yards")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("cardio_logs")
      .select("id, kind, distance, distance_unit, duration_minutes")
      .eq("log_date", date)
      .order("created_at", { ascending: true }),
  ]);

  const goals = profile.data;
  return {
    logs: (dayLogs.data ?? []).map((row) => ({
      id: row.id as string,
      kind: row.kind as CardioLogRow["kind"],
      distance: asNumber(row.distance),
      unit: row.distance_unit as string | null,
      minutes: asNumber(row.duration_minutes),
    })),
    weekTotals: weeklyTotals(
      (weekLogs.data ?? []).map((row) => ({
        kind: row.kind as string,
        distance: asNumber(row.distance),
        distance_unit: row.distance_unit as string | null,
      })),
    ),
    weeklyGoals: {
      run: asNumber(goals?.weekly_run_miles),
      cycle: asNumber(goals?.weekly_cycle_miles),
      swim: asNumber(goals?.weekly_swim_yards),
    },
  };
}

export type TanningData = {
  minutes: number | null; // saved for this date, if any
  lastMinutes: number | null; // your most recent earlier session
};

export async function loadTanning(supabase: SupabaseClient, date: string): Promise<TanningData> {
  const [today, previous] = await Promise.all([
    supabase.from("tanning_logs").select("minutes").eq("log_date", date).maybeSingle(),
    supabase
      .from("tanning_logs")
      .select("minutes")
      .lt("log_date", date)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return { minutes: asNumber(today.data?.minutes), lastMinutes: asNumber(previous.data?.minutes) };
}

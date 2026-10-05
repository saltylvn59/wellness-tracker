import Link from "next/link";
import { redirect } from "next/navigation";
import GoToToday from "@/components/GoToToday";
import TodayPill from "@/components/TodayPill";
import WorkoutWeekStrip from "@/components/WorkoutWeekStrip";
import { addDays, formatFullDate, formatWeekday, isoWeekday, isValidDateKey, weekDays } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { formatSetsReps, groupSupersets, type PlanExercise, type WorkoutDay } from "@/lib/workouts/plan";
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
            groupSupersets(exercises).map((group) => (
              <div
                key={group[0].id}
                className={
                  group.length > 1
                    ? "space-y-px overflow-hidden rounded-2xl border-2 border-accent"
                    : "overflow-hidden rounded-2xl"
                }
              >
                {group.length > 1 && (
                  <p className="bg-accent px-4 py-1 text-xs font-semibold text-on-accent">
                    Superset · no rest between
                  </p>
                )}
                {group.map((exercise) => {
                  const target = formatSetsReps(exercise.target_sets, exercise.rep_min, exercise.rep_max);
                  return (
                    <div key={exercise.id} className="flex min-h-14 items-center justify-between gap-3 bg-card px-4 py-3">
                      <p className="min-w-0 text-base font-medium">{exercise.name}</p>
                      <p className={`shrink-0 text-sm ${target ? "font-semibold" : "text-muted"}`}>
                        {target || "Set sets & reps"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          <p className="text-center text-xs text-muted">Logging your sets and weights is coming next.</p>
        </section>
      )}
    </div>
  );
}

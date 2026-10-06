import { describe, expect, it } from "vitest";
import { loadCardioDay, loadLiftDay, loadTanning } from "./queries";

// A stand-in for the database: each from("table") call hands back the next prepared
// answer for that table (in the order the page asks), and any query-builder call chains on.
function fakeSupabase(answers: Record<string, unknown[]>) {
  const queues = Object.fromEntries(Object.entries(answers).map(([table, rows]) => [table, [...rows]]));
  return {
    from(table: string) {
      const data = queues[table]?.shift() ?? null;
      const chain: unknown = new Proxy(
        {},
        {
          get: (_target, prop) =>
            prop === "then"
              ? (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve)
              : () => chain,
        },
      );
      return chain;
    },
  } as never;
}

describe("loadTanning", () => {
  it("returns today's minutes and the last earlier session", async () => {
    const db = fakeSupabase({ tanning_logs: [{ minutes: 12 }, { minutes: 8 }] });
    expect(await loadTanning(db, "2026-10-06")).toEqual({ minutes: 12, lastMinutes: 8 });
  });

  it("returns nulls when nothing is logged", async () => {
    expect(await loadTanning(fakeSupabase({ tanning_logs: [null, null] }), "2026-10-06")).toEqual({
      minutes: null,
      lastMinutes: null,
    });
  });
});

describe("loadCardioDay", () => {
  it("combines the week's totals, goals, today's logs, and your weight", async () => {
    const db = fakeSupabase({
      cardio_logs: [
        [
          { kind: "run", distance: "3.1", distance_unit: "mi" },
          { kind: "swim", distance: 500, distance_unit: "yd" },
        ],
        [{ id: "c1", kind: "run", distance: "3.1", distance_unit: "mi", duration_minutes: "28" }],
      ],
      profiles: [
        { weekly_run_miles: "5", weekly_cycle_miles: "10", weekly_swim_yards: null, target_weight_lb: "175.5" },
      ],
      weight_logs: [{ log_date: "2026-10-03", weight_lb: "185.4" }],
    });
    expect(await loadCardioDay(db, "user-1", "2026-10-06")).toEqual({
      logs: [{ id: "c1", kind: "run", distance: 3.1, unit: "mi", minutes: 28 }],
      weekTotals: { run: 3.1, cycle: 0, swim: 500 },
      weeklyGoals: { run: 5, cycle: 10, swim: null },
      latestWeight: { date: "2026-10-03", pounds: 185.4 },
      targetWeight: 175.5,
    });
  });

  it("handles a brand new account with nothing saved", async () => {
    const db = fakeSupabase({ cardio_logs: [[], []], profiles: [null], weight_logs: [null] });
    expect(await loadCardioDay(db, "user-1", "2026-10-06")).toEqual({
      logs: [],
      weekTotals: { run: 0, cycle: 0, swim: 0 },
      weeklyGoals: { run: null, cycle: null, swim: null },
      latestWeight: null,
      targetWeight: null,
    });
  });
});

describe("loadLiftDay", () => {
  it("gathers exercises, today's sets, ticks, bests, history, and 3-rep maxes", async () => {
    const db = fakeSupabase({
      workout_exercises: [[{ id: "e1", name: "Deadlift", target_sets: 3, rep_min: 3, rep_max: 5, superset_with_next: false }]],
      workout_sessions: [
        {
          sauna_done: true,
          stretch_done: false,
          workout_sets: [{ id: "s1", exercise_id: "e1", set_number: 1, weight: "315", reps: 3 }],
        },
      ],
      // Calls in order: three 3-rep max lifts, then the one exercise's best, then history.
      workout_sets: [
        { weight: "185" }, // incline press 3RM
        { weight: "315" }, // deadlift 3RM
        null, // squat: nothing logged
        { weight: "335" }, // best weight for e1
        [{ exercise_id: "e1", set_number: 1, weight: "305", reps: 5, workout_sessions: { session_date: "2026-09-29" } }],
      ],
    });
    const lift = await loadLiftDay(db, "2026-10-06", "day-1");
    expect(lift.exercises).toHaveLength(1);
    expect(lift.saunaDone).toBe(true);
    expect(lift.stretchDone).toBe(false);
    expect(lift.todaySets).toEqual([{ id: "s1", exercise_id: "e1", set_number: 1, weight: 315, reps: 3 }]);
    expect(lift.threeRepMaxes).toEqual([185, 315, null]);
    expect(lift.bestById.get("e1")).toBe(335);
    expect(lift.history).toEqual([
      { exercise_id: "e1", session_date: "2026-09-29", set_number: 1, weight: 305, reps: 5 },
    ]);
  });

  it("skips the per-exercise lookups when the day has no exercises", async () => {
    const db = fakeSupabase({
      workout_exercises: [[]],
      workout_sessions: [null],
      workout_sets: [null, null, null],
    });
    const lift = await loadLiftDay(db, "2026-10-06", "day-1");
    expect(lift).toMatchObject({ exercises: [], todaySets: [], history: [], saunaDone: false, stretchDone: false });
    expect(lift.bestById.size).toBe(0);
  });
});

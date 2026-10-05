import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN } from "./defaults";
import { formatRest, formatSetsReps, groupSupersets, parsePlanJson, REST_BETWEEN_EXERCISES } from "./plan";

describe("DEFAULT_PLAN", () => {
  it("covers all seven weekdays exactly once", () => {
    expect(DEFAULT_PLAN.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("matches the weekly schedule", () => {
    const byDay = Object.fromEntries(DEFAULT_PLAN.map((d) => [d.weekday, d]));
    expect(byDay[1]).toMatchObject({ kind: "lift", title: "Chest & Back" });
    expect(byDay[3]).toMatchObject({ kind: "lift", title: "Legs" });
    expect(byDay[5]).toMatchObject({ kind: "lift", title: "Delts & Arms" });
    for (const weekday of [2, 4, 6]) expect(byDay[weekday].kind).toBe("cardio");
    expect(byDay[7]).toMatchObject({ kind: "rest", title: "Rest Day" });
  });

  it("only lifting days have exercises, and the supersets are the paired ones", () => {
    for (const day of DEFAULT_PLAN) {
      expect(day.exercises.length > 0).toBe(day.kind === "lift");
    }
    const supersetted = DEFAULT_PLAN.flatMap((d) =>
      d.exercises.filter((e) => e.supersetWithNext).map((e) => e.name),
    );
    expect(supersetted).toEqual(["Pec deck", "Leg extensions"]);
  });
});

describe("formatSetsReps", () => {
  it("formats sets and a rep range", () => {
    expect(formatSetsReps(3, 8, 12)).toBe("3 × 8–12");
    expect(formatSetsReps(4, 10, 10)).toBe("4 × 10");
  });

  it("handles partial and empty targets", () => {
    expect(formatSetsReps(3, null, null)).toBe("3 sets");
    expect(formatSetsReps(1, null, null)).toBe("1 set");
    expect(formatSetsReps(null, 8, 12)).toBe("8–12 reps");
    expect(formatSetsReps(null, null, null)).toBe("");
  });
});

const base = { name: "Incline press", sets: "3", repMin: "8", repMax: "12", supersetWithNext: false };

describe("parsePlanJson", () => {
  it("accepts a clean list, as JSON text or an array", () => {
    const list = [{ ...base, id: "abc" }, { ...base, name: "Dips", sets: "", repMin: "", repMax: "" }];
    const expected = {
      ok: true,
      exercises: [
        { id: "abc", name: "Incline press", target_sets: 3, rep_min: 8, rep_max: 12, superset_with_next: false },
        { id: undefined, name: "Dips", target_sets: null, rep_min: null, rep_max: null, superset_with_next: false },
      ],
    };
    expect(parsePlanJson(list)).toEqual(expected);
    expect(parsePlanJson(JSON.stringify(list))).toEqual(expected);
  });

  it("allows an empty list", () => {
    expect(parsePlanJson([])).toEqual({ ok: true, exercises: [] });
  });

  it("treats one filled-in rep end as exactly that many reps", () => {
    const result = parsePlanJson([{ ...base, repMin: "10", repMax: "" }]);
    expect(result.ok && result.exercises[0]).toMatchObject({ rep_min: 10, rep_max: 10 });
    const other = parsePlanJson([{ ...base, repMin: "", repMax: "6" }]);
    expect(other.ok && other.exercises[0]).toMatchObject({ rep_min: 6, rep_max: 6 });
  });

  it("clears the superset flag on the last exercise", () => {
    const result = parsePlanJson([
      { ...base, supersetWithNext: true },
      { ...base, name: "Pull downs", supersetWithNext: true },
    ]);
    expect(result.ok && result.exercises.map((e) => e.superset_with_next)).toEqual([true, false]);
  });

  it("rejects bad names, sets, and reps", () => {
    expect(parsePlanJson([{ ...base, name: "   " }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, name: "x".repeat(81) }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, sets: "0" }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, sets: "21" }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, sets: "many" }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, repMin: "0" }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, repMax: "101" }]).ok).toBe(false);
    expect(parsePlanJson([{ ...base, repMin: "12", repMax: "8" }]).ok).toBe(false);
  });

  it("rejects malformed input and oversized lists", () => {
    expect(parsePlanJson("not json").ok).toBe(false);
    expect(parsePlanJson({ not: "an array" }).ok).toBe(false);
    expect(parsePlanJson(["a string"]).ok).toBe(false);
    expect(parsePlanJson(Array.from({ length: 31 }, () => base)).ok).toBe(false);
    expect(parsePlanJson(Array.from({ length: 30 }, () => base)).ok).toBe(true);
  });
});

describe("groupSupersets", () => {
  it("links an exercise with the one after it", () => {
    const list = [
      { n: "A", superset_with_next: true },
      { n: "B", superset_with_next: false },
      { n: "C", superset_with_next: false },
    ];
    expect(groupSupersets(list).map((g) => g.map((e) => e.n))).toEqual([["A", "B"], ["C"]]);
  });

  it("supports longer chains and an empty list", () => {
    const chain = [
      { n: "A", superset_with_next: true },
      { n: "B", superset_with_next: true },
      { n: "C", superset_with_next: false },
    ];
    expect(groupSupersets(chain).map((g) => g.length)).toEqual([3]);
    expect(groupSupersets([])).toEqual([]);
  });
});

describe("rest between exercises", () => {
  it("defaults to 3-5 minutes", () => {
    expect(REST_BETWEEN_EXERCISES).toEqual({ minMinutes: 3, maxMinutes: 5 });
    expect(formatRest()).toBe("Rest 3–5 min");
  });

  it("formats other ranges", () => {
    expect(formatRest({ minMinutes: 2, maxMinutes: 2 })).toBe("Rest 2 min");
    expect(formatRest({ minMinutes: 1, maxMinutes: 3 })).toBe("Rest 1–3 min");
  });

  it("puts a rest after every group except the last (so none inside a superset)", () => {
    const list = [
      { n: "Pec deck", superset_with_next: true },
      { n: "Incline press", superset_with_next: false },
      { n: "Pull downs", superset_with_next: false },
      { n: "Deadlift", superset_with_next: false },
    ];
    const groups = groupSupersets(list);
    const restsAfter = groups.map((_, i) => i < groups.length - 1);
    expect(groups.map((g) => g.map((e) => e.n))).toEqual([
      ["Pec deck", "Incline press"],
      ["Pull downs"],
      ["Deadlift"],
    ]);
    expect(restsAfter).toEqual([true, true, false]);
  });
});

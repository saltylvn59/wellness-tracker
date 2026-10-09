import { describe, expect, it } from "vitest";
import { clubTotal, MIN_REPS_FOR_MAX, THREE_REP_MAX_LIFTS } from "./maxes";

describe("3-rep max lifts", () => {
  it("shows Bench, Deadlift and Squat, in that order", () => {
    expect(THREE_REP_MAX_LIFTS.map((l) => l.label)).toEqual(["Bench", "Deadlift", "Squat"]);
  });

  it("matches the plan's exercise names (singular or plural), and counts sets of 3 or more reps", () => {
    expect(THREE_REP_MAX_LIFTS.map((l) => l.exerciseNames[0])).toEqual(["Incline press", "Deadlift", "Squat"]);
    expect(THREE_REP_MAX_LIFTS[2].exerciseNames).toContain("Squats");
    expect(MIN_REPS_FOR_MAX).toBe(3);
  });
});

describe("clubTotal", () => {
  it("adds the three maxes, counting missing ones as 0", () => {
    expect(clubTotal([225, 405, 365])).toBe(995);
    expect(clubTotal([225, null, 315])).toBe(540);
    expect(clubTotal([null, null, null])).toBe(0);
  });
});

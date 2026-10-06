import { describe, expect, it } from "vitest";
import { MIN_REPS_FOR_MAX, THREE_REP_MAX_LIFTS } from "./maxes";

describe("3-rep max lifts", () => {
  it("shows Incline Press, Deadlift and Squat, in that order", () => {
    expect(THREE_REP_MAX_LIFTS.map((l) => l.label)).toEqual(["Incline Press", "Deadlift", "Squat"]);
  });

  it("matches the plan's exercise names (singular or plural), and counts sets of 3 or more reps", () => {
    expect(THREE_REP_MAX_LIFTS.map((l) => l.exerciseNames[0])).toEqual(["Incline press", "Deadlift", "Squat"]);
    expect(THREE_REP_MAX_LIFTS[2].exerciseNames).toContain("Squats");
    expect(MIN_REPS_FOR_MAX).toBe(3);
  });
});

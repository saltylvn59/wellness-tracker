import { describe, expect, it } from "vitest";
import { computeStreak, milestoneMessage, nextMilestone } from "./streak";

// Oct 2026: Mon 5, Tue 6, Wed 7, Thu 8, Fri 9, Sat 10, Sun 11, Mon 12 ...
const SUNDAY_REST = new Set([7]);
const NO_REST = new Set<number>();

describe("computeStreak", () => {
  it("is zero with no workouts", () => {
    expect(computeStreak([], "2026-10-12", SUNDAY_REST)).toEqual({ current: 0, longest: 0, doneToday: false });
  });

  it("counts consecutive days ending today", () => {
    const result = computeStreak(["2026-10-05", "2026-10-06", "2026-10-07"], "2026-10-07", SUNDAY_REST);
    expect(result).toEqual({ current: 3, longest: 3, doneToday: true });
  });

  it("keeps the streak alive today until the day is over", () => {
    // Worked out Mon and Tue; it's Wed and nothing logged yet.
    const result = computeStreak(["2026-10-05", "2026-10-06"], "2026-10-07", SUNDAY_REST);
    expect(result).toEqual({ current: 2, longest: 2, doneToday: false });
  });

  it("ends the streak after a missed day", () => {
    // Mon, Tue done; Wed missed; it's Thu with nothing yet.
    const result = computeStreak(["2026-10-05", "2026-10-06"], "2026-10-08", SUNDAY_REST);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);
  });

  it("does not break on a rest day, and doesn't count it", () => {
    // Fri, Sat done; Sunday is rest; Mon done; today is Mon.
    const result = computeStreak(["2026-10-09", "2026-10-10", "2026-10-12"], "2026-10-12", SUNDAY_REST);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("counts a workout logged on a rest day as a bonus day", () => {
    const result = computeStreak(["2026-10-10", "2026-10-11", "2026-10-12"], "2026-10-12", SUNDAY_REST);
    expect(result.current).toBe(3);
  });

  it("treats that same Sunday as a missed day when it isn't a rest day", () => {
    // Fri, Sat done; Sunday NOT a rest day and skipped; Mon done.
    const result = computeStreak(["2026-10-09", "2026-10-10", "2026-10-12"], "2026-10-12", NO_REST);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(2);
  });

  it("finds the longest streak separately from the current one", () => {
    // Earlier run of 4 (Mon-Thu), a gap on Fri/Sat, then 2 days (Mon, Tue).
    const dates = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-12", "2026-10-13"];
    const result = computeStreak(dates, "2026-10-13", SUNDAY_REST);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(4);
  });

  it("carries a streak across several weeks, skipping each Sunday", () => {
    // Every day Mon 5 Oct through Sat 17 Oct except the two Sundays.
    const dates = [
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10",
      "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17",
    ];
    const result = computeStreak(dates, "2026-10-17", SUNDAY_REST);
    expect(result).toEqual({ current: 12, longest: 12, doneToday: true });
  });

  it("ignores logs dated in the future", () => {
    const result = computeStreak(["2026-10-05", "2026-10-20"], "2026-10-05", SUNDAY_REST);
    expect(result).toEqual({ current: 1, longest: 1, doneToday: true });
    expect(computeStreak(["2026-10-20"], "2026-10-05", SUNDAY_REST)).toEqual({
      current: 0,
      longest: 0,
      doneToday: false,
    });
  });

  it("works across a month boundary and with duplicate dates", () => {
    const dates = ["2026-09-30", "2026-10-01", "2026-10-01", "2026-10-02"];
    expect(computeStreak(dates, "2026-10-02", SUNDAY_REST).current).toBe(3);
  });

  it("a rest day today (not logged) doesn't end the streak", () => {
    // Sat done, today is Sunday (rest) with nothing logged.
    const result = computeStreak(["2026-10-09", "2026-10-10"], "2026-10-11", SUNDAY_REST);
    expect(result).toEqual({ current: 2, longest: 2, doneToday: false });
  });
});

describe("milestones", () => {
  it("finds the next milestone", () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(3)).toBe(7);
    expect(nextMilestone(8)).toBe(14);
    expect(nextMilestone(365)).toBeNull();
  });

  it("celebrates exact milestones only", () => {
    expect(milestoneMessage(3)).toBe("🎉 3 days in a row!");
    expect(milestoneMessage(7)).toBe("🎉 1 week strong!");
    expect(milestoneMessage(14)).toBe("🎉 2 weeks strong!");
    expect(milestoneMessage(30)).toBe("🎉 30 days in a row!");
    expect(milestoneMessage(365)).toBe("🎉 A whole year of consistency!");
    for (const n of [0, 1, 2, 4, 8, 29, 31]) expect(milestoneMessage(n)).toBeNull();
  });
});

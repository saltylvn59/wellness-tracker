import { describe, expect, it } from "vitest";
import { coachPrompt, parseCoachAdvice } from "./weightCoach";

describe("parseCoachAdvice", () => {
  it("reads a good reply", () => {
    expect(parseCoachAdvice('{"pace_lb_per_week": 1.5, "note": "Nice steady start."}', "lose")).toEqual({
      pace: 1.5,
      note: "Nice steady start.",
    });
  });

  it("tolerates a code fence and a number sent as text", () => {
    expect(parseCoachAdvice('```json\n{"pace_lb_per_week": "1", "note": "ok"}\n```', "lose")?.pace).toBe(1);
  });

  it("pulls an unsafe pace back into range", () => {
    expect(parseCoachAdvice({ pace_lb_per_week: 6, note: "" }, "lose")?.pace).toBe(2);
    expect(parseCoachAdvice({ pace_lb_per_week: 3, note: "" }, "gain")?.pace).toBe(1);
  });

  it("rejects replies it can't trust", () => {
    expect(parseCoachAdvice("not json", "lose")).toBeNull();
    expect(parseCoachAdvice({ note: "no pace" }, "lose")).toBeNull();
    expect(parseCoachAdvice({ pace_lb_per_week: -1, note: "" }, "lose")).toBeNull();
    expect(parseCoachAdvice([1], "lose")).toBeNull();
  });

  it("keeps the note short", () => {
    const long = "a".repeat(500);
    expect(parseCoachAdvice({ pace_lb_per_week: 1, note: long }, "lose")?.note).toHaveLength(200);
  });
});

describe("coachPrompt", () => {
  it("describes the numbers and the trend", () => {
    const text = coachPrompt({ start: 200, current: 195, target: 180, direction: "lose", trend: -1, weeksTracked: 5 });
    expect(text).toContain("Current weight: 195.0 lb");
    expect(text).toContain("-1.0 lb per week");
    expect(coachPrompt({ start: 200, current: 195, target: 180, direction: "lose", trend: null, weeksTracked: 0 })).toContain(
      "not enough weigh-ins yet",
    );
  });
});

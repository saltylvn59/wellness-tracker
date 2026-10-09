import { describe, expect, it } from "vitest";
import { coachPrompt, parseCoachNote } from "./weightCoach";

describe("parseCoachNote", () => {
  it("reads a good reply", () => {
    expect(parseCoachNote('{"note": "Nice steady start."}')).toBe("Nice steady start.");
  });

  it("tolerates a code fence and tidies spacing", () => {
    expect(parseCoachNote('```json\n{"note": "  Keep   going. "}\n```')).toBe("Keep going.");
  });

  it("rejects replies it can't trust", () => {
    expect(parseCoachNote("not json")).toBeNull();
    expect(parseCoachNote({ pace: 1 })).toBeNull();
    expect(parseCoachNote({ note: "   " })).toBeNull();
    expect(parseCoachNote([1])).toBeNull();
  });

  it("keeps the note short", () => {
    expect(parseCoachNote({ note: "a".repeat(500) })).toHaveLength(200);
  });
});

describe("coachPrompt", () => {
  const base = { start: 200, current: 195, target: 180, direction: "lose" as const, pace: 2, weeksTracked: 5 };

  it("describes the numbers, the chosen pace and the trend", () => {
    const text = coachPrompt({ ...base, trend: -1 });
    expect(text).toContain("Current weight: 195.0 lb");
    expect(text).toContain("Chosen pace: 2.0 lb per week");
    expect(text).toContain("-1.0 lb per week");
    expect(coachPrompt({ ...base, trend: null })).toContain("not enough weigh-ins yet");
  });
});

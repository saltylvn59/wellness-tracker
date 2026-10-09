import { describe, expect, it } from "vitest";
import { dayTitle, describeWeek, parseWeekKinds, titleAfterChange } from "./weekSetup";

describe("dayTitle", () => {
  it("names cardio and rest days by their kind", () => {
    expect(dayTitle({ kind: "cardio", title: "Legs" })).toBe("Cardio");
    expect(dayTitle({ kind: "rest", title: "Rest Day" })).toBe("Recovery Day");
  });

  it("uses a lifting day's own name, or 'Lifting' for a generic one", () => {
    expect(dayTitle({ kind: "lift", title: "Legs" })).toBe("Legs");
    expect(dayTitle({ kind: "lift", title: "Cardio" })).toBe("Lifting");
  });
});

describe("titleAfterChange", () => {
  it("gives a new lifting day a lifting name and keeps real names", () => {
    expect(titleAfterChange("lift", "Cardio")).toBe("Lifting");
    expect(titleAfterChange("lift", "Recovery Day")).toBe("Lifting");
    expect(titleAfterChange("cardio", "Legs")).toBe("Legs");
    expect(titleAfterChange("lift", "Legs")).toBe("Legs");
  });
});

describe("parseWeekKinds", () => {
  const good = { 1: "lift", 2: "cardio", 3: "lift", 4: "cardio", 5: "lift", 6: "cardio", 7: "rest" };

  it("reads all seven days", () => {
    const week = parseWeekKinds(good);
    expect(week?.get(1)).toBe("lift");
    expect(week?.get(7)).toBe("rest");
    expect(week?.size).toBe(7);
  });

  it("rejects missing days or unknown kinds", () => {
    expect(parseWeekKinds({ ...good, 7: undefined })).toBeNull();
    expect(parseWeekKinds({ ...good, 3: "yoga" })).toBeNull();
    expect(parseWeekKinds(null)).toBeNull();
    expect(parseWeekKinds(["lift"])).toBeNull();
  });
});

describe("describeWeek", () => {
  it("counts each kind of day", () => {
    expect(describeWeek(["lift", "cardio", "lift", "cardio", "lift", "cardio", "rest"])).toBe(
      "3 lifting · 3 cardio · 1 rest",
    );
    expect(describeWeek(["cardio", "cardio", "cardio", "cardio", "cardio", "cardio", "cardio"])).toBe("7 cardio");
  });
});

import { describe, expect, it } from "vitest";
import { dayTitle, parseWeekKinds, titleAfterChange, toggleDay } from "./weekSetup";

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
  const good = { 1: "lift", 2: "cardio", 3: "lift", 4: "cardio", 5: "lift", 6: "cardio" };

  it("reads Monday to Saturday and always makes Sunday a rest day", () => {
    const week = parseWeekKinds(good);
    expect(week?.get(1)).toBe("lift");
    expect(week?.get(6)).toBe("cardio");
    expect(week?.get(7)).toBe("rest");
    expect(parseWeekKinds({ ...good, 7: "lift" })?.get(7)).toBe("rest");
  });

  it("rejects missing days or unknown kinds", () => {
    expect(parseWeekKinds({ ...good, 6: undefined })).toBeNull();
    expect(parseWeekKinds({ ...good, 3: "yoga" })).toBeNull();
    expect(parseWeekKinds(null)).toBeNull();
    expect(parseWeekKinds(["lift"])).toBeNull();
  });
});

describe("toggleDay", () => {
  const week = ["lift", "cardio", "rest"] as const;

  it("turns a day on, moving it out of the other row", () => {
    expect(toggleDay([...week], 2, "lift")).toEqual(["lift", "cardio", "lift"]);
    expect(toggleDay([...week], 0, "cardio")).toEqual(["cardio", "cardio", "rest"]);
  });

  it("turns a day that's already on off (rest)", () => {
    expect(toggleDay([...week], 0, "lift")).toEqual(["rest", "cardio", "rest"]);
  });
});

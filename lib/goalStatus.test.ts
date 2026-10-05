import { describe, expect, it } from "vitest";
import { getGoalStatus } from "./goalStatus";

describe("getGoalStatus", () => {
  it("is green (under) below the goal", () => {
    expect(getGoalStatus(1500, 2000)).toBe("under");
    expect(getGoalStatus(0, 2000)).toBe("under");
  });

  it("is green (under) exactly at the goal", () => {
    expect(getGoalStatus(2000, 2000)).toBe("under");
  });

  it("is red (over) as soon as the goal is exceeded", () => {
    expect(getGoalStatus(2001, 2000)).toBe("over");
    expect(getGoalStatus(3500, 2000)).toBe("over");
  });

  it("is neutral when no goal is set", () => {
    expect(getGoalStatus(1500, null)).toBe("none");
    expect(getGoalStatus(1500, undefined)).toBe("none");
    expect(getGoalStatus(1500, 0)).toBe("none");
  });
});

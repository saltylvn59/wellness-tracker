import { describe, expect, it } from "vitest";
import {
  formatWeightLb,
  joinWeight,
  parseWeight,
  splitWeight,
  TENTH_OPTIONS,
  WHOLE_POUND_OPTIONS,
} from "./weight";

describe("weight wheels", () => {
  it("whole pounds run 70 to 500 and tenths run 0 to 9", () => {
    expect(WHOLE_POUND_OPTIONS[0]).toBe(70);
    expect(WHOLE_POUND_OPTIONS.at(-1)).toBe(500);
    expect(TENTH_OPTIONS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("splits and joins a weight without drifting", () => {
    expect(splitWeight(185.4)).toEqual({ whole: 185, tenth: 4 });
    expect(splitWeight(180)).toEqual({ whole: 180, tenth: 0 });
    expect(joinWeight(185, 4)).toBe(185.4);
    expect(joinWeight(180, 0)).toBe(180);
  });

  it("rounds odd decimals to the nearest tenth, carrying into the whole number", () => {
    expect(splitWeight(185.96)).toEqual({ whole: 186, tenth: 0 });
    expect(splitWeight(185.04)).toEqual({ whole: 185, tenth: 0 });
  });

  it("keeps out-of-range weights on the wheels", () => {
    expect(splitWeight(20)).toEqual({ whole: 70, tenth: 0 });
    expect(splitWeight(900)).toEqual({ whole: 500, tenth: 0 });
  });
});

describe("parseWeight", () => {
  it("accepts 70 to 500 lb, rounded to a tenth", () => {
    expect(parseWeight(185.4)).toBe(185.4);
    expect(parseWeight(70)).toBe(70);
    expect(parseWeight(500)).toBe(500);
    expect(parseWeight(185.44)).toBe(185.4);
  });

  it("rejects anything else", () => {
    for (const bad of [69.9, 500.1, 0, -150, NaN, Infinity, "185", null, undefined]) {
      expect(parseWeight(bad)).toBeNull();
    }
  });
});

describe("formatWeightLb", () => {
  it("shows one decimal", () => {
    expect(formatWeightLb(185.4)).toBe("185.4");
    expect(formatWeightLb(185)).toBe("185.0");
  });
});

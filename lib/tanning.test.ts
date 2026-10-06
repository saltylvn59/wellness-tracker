import { describe, expect, it } from "vitest";
import {
  DEFAULT_TANNING_MINUTES,
  isTanningDay,
  parseTanningMinutes,
  TANNING_MINUTE_OPTIONS,
} from "./tanning";

describe("isTanningDay", () => {
  it("is Tuesday and Thursday only", () => {
    expect([1, 2, 3, 4, 5, 6, 7].filter(isTanningDay)).toEqual([2, 4]);
  });
});

describe("tanning minutes", () => {
  it("the wheel runs from 5 to 15 and starts on 10", () => {
    expect(TANNING_MINUTE_OPTIONS[0]).toBe(5);
    expect(TANNING_MINUTE_OPTIONS.at(-1)).toBe(15);
    expect(TANNING_MINUTE_OPTIONS).toHaveLength(11);
    expect(TANNING_MINUTE_OPTIONS).toContain(DEFAULT_TANNING_MINUTES);
  });

  it("accepts whole minutes from 5 to 15", () => {
    expect(parseTanningMinutes(5)).toBe(5);
    expect(parseTanningMinutes(15)).toBe(15);
  });

  it("rejects anything else", () => {
    for (const bad of [4, 16, 0, -5, 7.5, NaN, "10", null, undefined]) {
      expect(parseTanningMinutes(bad)).toBeNull();
    }
  });
});

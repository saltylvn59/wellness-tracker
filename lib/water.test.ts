import { describe, expect, it } from "vitest";
import {
  BOTTLE_OZ,
  canAddWater,
  DAILY_WATER_OZ,
  MAX_DAILY_WATER_OZ,
  STEP_MILESTONES,
  WATER_STEPS,
  waterProgress,
} from "./water";

describe("water constants", () => {
  it("one tap is 20 oz and the goal is 3 steps (60 oz)", () => {
    expect(BOTTLE_OZ).toBe(20);
    expect(WATER_STEPS).toBe(3);
    expect(DAILY_WATER_OZ).toBe(60);
    expect(STEP_MILESTONES).toEqual([20, 40, 60]);
  });
});

describe("waterProgress", () => {
  it("starts empty", () => {
    expect(waterProgress(0)).toEqual({ total: 0, steps: 0, goalReached: false, remaining: 60, percent: 0 });
  });

  it("counts a step each time you reach 20, 40, and 60 oz", () => {
    expect(waterProgress(20)).toMatchObject({ steps: 1, goalReached: false, remaining: 40 });
    expect(waterProgress(40)).toMatchObject({ steps: 2, goalReached: false, remaining: 20 });
    expect(waterProgress(60)).toMatchObject({ steps: 3, goalReached: true, remaining: 0, percent: 100 });
  });

  it("doesn't award a step for a partial bottle", () => {
    expect(waterProgress(19).steps).toBe(0);
    expect(waterProgress(39).steps).toBe(1);
    expect(waterProgress(59).steps).toBe(2);
    expect(waterProgress(59).goalReached).toBe(false);
  });

  it("keeps steps at 3 and the bar at 100% past the goal", () => {
    expect(waterProgress(100)).toMatchObject({ total: 100, steps: 3, goalReached: true, remaining: 0, percent: 100 });
  });

  it("ignores negative or fractional totals", () => {
    expect(waterProgress(-5).total).toBe(0);
    expect(waterProgress(20.4).total).toBe(20);
  });
});

describe("canAddWater", () => {
  it("allows more water up to the daily cap", () => {
    expect(canAddWater(0)).toBe(true);
    expect(canAddWater(60)).toBe(true);
    expect(canAddWater(MAX_DAILY_WATER_OZ - BOTTLE_OZ)).toBe(true);
  });

  it("refuses once the cap would be passed", () => {
    expect(canAddWater(MAX_DAILY_WATER_OZ)).toBe(false);
    expect(canAddWater(MAX_DAILY_WATER_OZ - BOTTLE_OZ + 1)).toBe(false);
  });
});

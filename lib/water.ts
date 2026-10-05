// Water tracking: one tap adds 20 oz, and the daily goal is 3 steps of 20 oz (60 oz).

export const BOTTLE_OZ = 20;
export const WATER_STEPS = 3;
export const DAILY_WATER_OZ = BOTTLE_OZ * WATER_STEPS; // 60

// A sanity cap so a stuck button or a bug can't pile up absurd totals in one day.
export const MAX_DAILY_WATER_OZ = 300;

export type WaterProgress = {
  total: number; // ounces so far today
  steps: number; // how many of the 3 steps are done (0 to 3)
  goalReached: boolean;
  remaining: number; // ounces left to reach the daily goal (0 once reached)
  percent: number; // 0 to 100, capped, for a bar
};

export function waterProgress(totalOz: number): WaterProgress {
  const total = Math.max(0, Math.round(totalOz));
  const steps = Math.min(WATER_STEPS, Math.floor(total / BOTTLE_OZ));
  return {
    total,
    steps,
    goalReached: total >= DAILY_WATER_OZ,
    remaining: Math.max(0, DAILY_WATER_OZ - total),
    percent: Math.min(100, (total / DAILY_WATER_OZ) * 100),
  };
}

/** Whether one more bottle fits under the daily sanity cap. */
export function canAddWater(currentTotalOz: number): boolean {
  return currentTotalOz + BOTTLE_OZ <= MAX_DAILY_WATER_OZ;
}

/** The ounces at the end of each step: [20, 40, 60]. */
export const STEP_MILESTONES: number[] = Array.from({ length: WATER_STEPS }, (_, i) => (i + 1) * BOTTLE_OZ);

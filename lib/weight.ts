// Body weight (pounds): a weigh-in log on cardio days and a target weight in Settings.
// The scroll wheels pick whole pounds and tenths (like 185 and .4 for 185.4 lb).

export const MIN_WEIGHT_LB = 70;
export const MAX_WEIGHT_LB = 500;
export const DEFAULT_WEIGHT_LB = 150; // where the wheels start before your first weigh-in

// A weigh-in as shown on the Weight card: the date you weighed in and the pounds.
export type LatestWeight = { date: string; pounds: number };

/** 70, 71 ... 500: the whole-pound wheel. */
export const WHOLE_POUND_OPTIONS: number[] = Array.from(
  { length: MAX_WEIGHT_LB - MIN_WEIGHT_LB + 1 },
  (_, i) => MIN_WEIGHT_LB + i,
);
/** 0 to 9: the tenths wheel. */
export const TENTH_OPTIONS: number[] = Array.from({ length: 10 }, (_, i) => i);

/** 185.4 -> { whole: 185, tenth: 4 }. Always lands on a value the wheels can show. */
export function splitWeight(lb: number): { whole: number; tenth: number } {
  const tenths = Math.round(lb * 10);
  const clamped = Math.min(MAX_WEIGHT_LB * 10, Math.max(MIN_WEIGHT_LB * 10, tenths));
  return { whole: Math.floor(clamped / 10), tenth: clamped % 10 };
}

/** { whole: 185, tenth: 4 } -> 185.4 */
export function joinWeight(whole: number, tenth: number): number {
  return (whole * 10 + tenth) / 10;
}

/** A weight from the browser: a number from 70 to 500 (rounded to a tenth), or null. */
export function parseWeight(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  return rounded >= MIN_WEIGHT_LB && rounded <= MAX_WEIGHT_LB ? rounded : null;
}

/** 185.4 -> "185.4", 185 -> "185.0" (one decimal, like a scale shows it). */
export function formatWeightLb(lb: number): string {
  return lb.toFixed(1);
}

/** How far you are from your target: "8.4 lb to go", or "At your target" (within 0.05). */
export function describeTargetGap(current: number, target: number): { atTarget: boolean; text: string } {
  const gap = Math.round(Math.abs(current - target) * 10) / 10;
  return gap < 0.05
    ? { atTarget: true, text: "At your target" }
    : { atTarget: false, text: `${formatWeightLb(gap)} lb to go` };
}

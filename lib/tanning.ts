// Tanning time: logged on Tuesdays and Thursdays, 5 to 15 minutes, picked on a scroll wheel.
// It's a quiet little extra: it doesn't count toward streaks or the week rings.

export const TANNING_WEEKDAYS = [2, 4] as const; // Tuesday and Thursday (Monday = 1)
export const MIN_TANNING_MINUTES = 5;
export const MAX_TANNING_MINUTES = 15;
export const DEFAULT_TANNING_MINUTES = 10;

/** 5, 6, 7 ... 15: the choices on the wheel. */
export const TANNING_MINUTE_OPTIONS: number[] = Array.from(
  { length: MAX_TANNING_MINUTES - MIN_TANNING_MINUTES + 1 },
  (_, i) => MIN_TANNING_MINUTES + i,
);

/** True when this weekday (Monday = 1 ... Sunday = 7) has a tanning log. */
export function isTanningDay(weekday: number): boolean {
  return (TANNING_WEEKDAYS as readonly number[]).includes(weekday);
}

/** A whole number from 5 to 15, or null if it's anything else. */
export function parseTanningMinutes(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= MIN_TANNING_MINUTES && value <= MAX_TANNING_MINUTES ? value : null;
}

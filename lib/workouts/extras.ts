// Sauna (start of a lifting workout) and stretch (end of it).

export const SAUNA_MIN = 5;
export const SAUNA_MAX = 30;
export const SAUNA_DEFAULT = 10;

/** Every minute from 5 to 30, for the sauna wheel. */
export const SAUNA_OPTIONS: number[] = Array.from(
  { length: SAUNA_MAX - SAUNA_MIN + 1 },
  (_, i) => SAUNA_MIN + i,
);

/** The stretch session is a fixed 10 minutes; you just tick it off. */
export const STRETCH_MINUTES = 10;

/** Where the sauna wheel starts: the minutes already logged today, else 10. */
export function defaultSaunaMinutes(loggedToday?: number | null): number {
  if (loggedToday !== undefined && loggedToday !== null && Number.isInteger(loggedToday)) {
    return Math.min(SAUNA_MAX, Math.max(SAUNA_MIN, loggedToday));
  }
  return SAUNA_DEFAULT;
}

export type SaunaResult = { ok: true; minutes: number } | { ok: false; message: string };

// Never trust the browser: this runs on the server before sauna time is saved.
export function validateSaunaMinutes(minutes: unknown): SaunaResult {
  if (
    typeof minutes !== "number" ||
    !Number.isInteger(minutes) ||
    minutes < SAUNA_MIN ||
    minutes > SAUNA_MAX
  ) {
    return { ok: false, message: `Sauna time must be a whole number from ${SAUNA_MIN} to ${SAUNA_MAX} minutes.` };
  }
  return { ok: true, minutes };
}

// Types and pure helpers for a lifting day's exercise list.

import type { DayKind } from "./defaults";

export type WorkoutDay = {
  id: string;
  weekday: number; // 1 = Monday ... 7 = Sunday
  kind: DayKind;
  title: string;
};

export type PlanExercise = {
  id: string;
  name: string;
  target_sets: number | null;
  rep_min: number | null;
  rep_max: number | null;
  superset_with_next: boolean;
};

// What the plan editor sends to the server (id is missing for new exercises).
export type PlanExerciseInput = {
  id?: string;
  name: string;
  sets: string;
  repMin: string;
  repMax: string;
  supersetWithNext: boolean;
};

export type CleanExercise = {
  id?: string;
  name: string;
  target_sets: number | null;
  rep_min: number | null;
  rep_max: number | null;
  superset_with_next: boolean;
};

export type PlanParseResult =
  | { ok: true; exercises: CleanExercise[] }
  | { ok: false; message: string };

export const MAX_EXERCISES = 30;

/** "3 × 8–12", "3 × 10", "3 sets", "8–12 reps", or "" when nothing is set. */
export function formatSetsReps(
  sets: number | null,
  repMin: number | null,
  repMax: number | null,
): string {
  const reps =
    repMin === null || repMax === null ? "" : repMin === repMax ? `${repMin}` : `${repMin}–${repMax}`;
  if (sets !== null && reps) return `${sets} × ${reps}`;
  if (sets !== null) return `${sets} ${sets === 1 ? "set" : "sets"}`;
  if (reps) return `${reps} reps`;
  return "";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Blank -> null, a whole number in [min, max] -> that number, anything else -> "invalid".
function readWhole(value: unknown, min: number, max: number): number | null | "invalid" {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return "invalid";
  const rounded = Math.round(n);
  return rounded < min || rounded > max ? "invalid" : rounded;
}

// Checks the exercise list sent by the plan editor. Never trust the browser.
export function parsePlanJson(raw: unknown): PlanParseResult {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  }
  if (!Array.isArray(data)) return { ok: false, message: "Something went wrong. Please try again." };
  if (data.length > MAX_EXERCISES) {
    return { ok: false, message: `A day can have up to ${MAX_EXERCISES} exercises.` };
  }

  const exercises: CleanExercise[] = [];
  for (const item of data) {
    if (!isRecord(item)) return { ok: false, message: "Something went wrong. Please try again." };

    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (name.length < 1 || name.length > 80) {
      return { ok: false, message: "Every exercise needs a name (up to 80 characters)." };
    }

    const sets = readWhole(item.sets, 1, 20);
    if (sets === "invalid") {
      return { ok: false, message: `Sets for "${name}" must be a whole number from 1 to 20.` };
    }

    let repMin = readWhole(item.repMin, 1, 100);
    let repMax = readWhole(item.repMax, 1, 100);
    if (repMin === "invalid" || repMax === "invalid") {
      return { ok: false, message: `Reps for "${name}" must be whole numbers from 1 to 100.` };
    }
    // One end filled in means "exactly that many reps".
    if (repMin !== null && repMax === null) repMax = repMin;
    if (repMax !== null && repMin === null) repMin = repMax;
    if (repMin !== null && repMax !== null && repMin > repMax) {
      return { ok: false, message: `For "${name}", the minimum reps can't be more than the maximum.` };
    }

    exercises.push({
      id: typeof item.id === "string" && item.id !== "" ? item.id : undefined,
      name,
      target_sets: sets,
      rep_min: repMin,
      rep_max: repMax,
      superset_with_next: item.supersetWithNext === true,
    });
  }

  // The last exercise has nothing after it to superset with.
  if (exercises.length > 0) exercises[exercises.length - 1].superset_with_next = false;

  return { ok: true, exercises };
}

// Groups consecutive exercises that are supersetted together, e.g.
// [A (superset), B, C] -> [[A, B], [C]]. Used to draw linked pairs.
export function groupSupersets<T extends { superset_with_next: boolean }>(exercises: T[]): T[][] {
  const groups: T[][] = [];
  let current: T[] = [];
  for (const exercise of exercises) {
    current.push(exercise);
    if (!exercise.superset_with_next) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

// How long to rest after an exercise (or after a superset pair) before the next one.
// Shown as a reminder between exercises; within a superset there is no rest.
export const REST_BETWEEN_EXERCISES = { minMinutes: 3, maxMinutes: 5 } as const;

/** "Rest 3–5 min", or "Rest 4 min" when both ends are equal. */
export function formatRest(
  range: { minMinutes: number; maxMinutes: number } = REST_BETWEEN_EXERCISES,
): string {
  const { minMinutes, maxMinutes } = range;
  return minMinutes === maxMinutes
    ? `Rest ${minMinutes} min`
    : `Rest ${minMinutes}–${maxMinutes} min`;
}

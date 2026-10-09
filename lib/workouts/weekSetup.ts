// Choosing which weekdays are lifting, cardio, or rest days ("Your week" on the Fitness tab).
// Each weekday row in workout_days keeps its exercises even when you switch it to cardio
// or rest, so switching it back to lifting brings them back.

import { REST_DAY_TITLE, type DayKind } from "./defaults";

export const DAY_KINDS: DayKind[] = ["lift", "cardio", "rest"];
export const KIND_ICON: Record<DayKind, string> = { lift: "🏋️", cardio: "🏃", rest: "🧘" };
export const KIND_NAME: Record<DayKind, string> = { lift: "Lifting", cardio: "Cardio", rest: "Rest" };

// Titles that only describe a kind of day (not a real lifting day's name like "Legs").
const GENERIC_TITLES = new Set(["Cardio", "Rest Day", REST_DAY_TITLE, "Lifting"]);

/** The heading for a day: cardio and rest always use their own names; lifting days use yours. */
export function dayTitle(day: { kind: DayKind; title: string }): string {
  if (day.kind === "rest") return REST_DAY_TITLE;
  if (day.kind === "cardio") return "Cardio";
  return GENERIC_TITLES.has(day.title) ? "Lifting" : day.title;
}

/**
 * The title to save when a day changes kind. A day becoming a lifting day gets "Lifting"
 * unless it already has a lifting name. Otherwise the old title is kept, so a lifting
 * day switched to cardio and back is still called "Legs".
 */
export function titleAfterChange(kind: DayKind, currentTitle: string): string {
  if (kind === "lift" && GENERIC_TITLES.has(currentTitle)) return "Lifting";
  return currentTitle;
}

/** Checks the week sent by the browser: every weekday 1-7 with lift, cardio, or rest. */
export function parseWeekKinds(raw: unknown): Map<number, DayKind> | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const week = new Map<number, DayKind>();
  for (let weekday = 1; weekday <= 7; weekday++) {
    const kind = (raw as Record<string, unknown>)[String(weekday)];
    if (typeof kind !== "string" || !DAY_KINDS.includes(kind as DayKind)) return null;
    week.set(weekday, kind as DayKind);
  }
  return week;
}

/** "3 lifting · 3 cardio · 1 rest" (kinds with no days are left out). */
export function describeWeek(kinds: DayKind[]): string {
  return DAY_KINDS.map((kind) => [kind, kinds.filter((k) => k === kind).length] as const)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${count} ${kind === "lift" ? "lifting" : kind}`)
    .join(" · ");
}

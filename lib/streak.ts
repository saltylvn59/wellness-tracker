import { addDays, isoWeekday } from "./dates";

// A streak counts consecutive days on which you logged a workout (lifting sets or
// cardio). Rules:
//  - A rest day (e.g. Sunday) doesn't break the streak and doesn't add to it,
//    unless you log something that day, in which case it counts as a bonus day.
//  - Today doesn't break the streak until it's over: if you haven't logged yet,
//    the streak still shows what you had through yesterday.
//  - Any other day without a log ends the streak.
// All dates are "YYYY-MM-DD" keys in the user's local calendar.

export type StreakResult = {
  current: number; // the streak you're on right now
  longest: number; // the best streak in the history we looked at
  doneToday: boolean;
};

export function computeStreak(
  doneDates: Iterable<string>,
  today: string,
  restWeekdays: ReadonlySet<number>,
): StreakResult {
  const done = new Set(doneDates);
  const isRest = (date: string) => restWeekdays.has(isoWeekday(date));

  // Dates are "YYYY-MM-DD", so plain string comparison orders them correctly.
  const pastDays = [...done].filter((d) => d <= today).sort();
  if (pastDays.length === 0) return { current: 0, longest: 0, doneToday: false };
  const earliest = pastDays[0];

  // Current streak: walk backwards from today.
  let current = done.has(today) ? 1 : 0;
  for (let day = addDays(today, -1); day >= earliest; day = addDays(day, -1)) {
    if (done.has(day)) current++;
    else if (!isRest(day)) break; // a missed non-rest day ends it
  }

  // Longest streak: walk forwards from the first logged day to today.
  let longest = 0;
  let run = 0;
  for (let day = earliest; day <= today; day = addDays(day, 1)) {
    if (done.has(day)) {
      run++;
      if (run > longest) longest = run;
    } else if (!isRest(day)) {
      run = 0;
    }
  }

  return { current, longest, doneToday: done.has(today) };
}

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365] as const;

/** The next milestone above `streak`, or null once you're past the last one. */
export function nextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null;
}

/** A celebration when `streak` is exactly a milestone, otherwise null. */
export function milestoneMessage(streak: number): string | null {
  if (!(STREAK_MILESTONES as readonly number[]).includes(streak)) return null;
  if (streak === 365) return "🎉 A whole year of consistency!";
  if (streak % 7 === 0) {
    const weeks = streak / 7;
    return `🎉 ${weeks} ${weeks === 1 ? "week" : "weeks"} strong!`;
  }
  return `🎉 ${streak} days in a row!`;
}

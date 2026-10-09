// The "3-rep max" lifts shown at the top of the lifting days, as the #1000club card:
// bench, deadlift and squat, which together aim for a 1,000 lb total.
// Your current 3-rep max for a lift = the heaviest weight you've logged for 3 or more reps.
// Sets are matched by exercise name (any capitalization, done in the database with ilike), so
// the lift needs to be in your plan under one of these names for its sets to count.

export const MIN_REPS_FOR_MAX = 3;

// Each lift lists the plan names that count for it (singular or plural). "Bench" is
// matched from your Incline press sets.
export const THREE_REP_MAX_LIFTS = [
  { label: "Bench", exerciseNames: ["Incline press", "Incline presses"] },
  { label: "Deadlift", exerciseNames: ["Deadlift", "Deadlifts"] },
  { label: "Squat", exerciseNames: ["Squat", "Squats"] },
] as const;

/** The #1000club goal: bench + deadlift + squat. */
export const CLUB_GOAL_LB = 1000;

/** Your #1000club total: the three maxes added up (lifts with nothing logged count as 0). */
export function clubTotal(maxes: (number | null)[]): number {
  return maxes.reduce<number>((sum, max) => sum + (max ?? 0), 0);
}

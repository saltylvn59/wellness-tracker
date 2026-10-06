// The "3-rep max" lifts shown at the top of the lifting days (Mon, Wed, Fri).
// Your current 3-rep max for a lift = the heaviest weight you've logged for 3 or more reps.
// Sets are matched by exercise name (any capitalization, done in the database with ilike), so
// the lift needs to be in your plan under one of these names for its sets to count.

export const MIN_REPS_FOR_MAX = 3;

// Each lift lists the plan names that count for it (singular or plural).
export const THREE_REP_MAX_LIFTS = [
  { label: "Incline Press", exerciseNames: ["Incline press", "Incline presses"] },
  { label: "Deadlift", exerciseNames: ["Deadlift", "Deadlifts"] },
  { label: "Squat", exerciseNames: ["Squat", "Squats"] },
] as const;

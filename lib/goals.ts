// Goals from the Settings form. The daily calorie goal is required (it drives the
// green/red date circle). The three daily macro goals and the three weekly cardio
// distance goals are optional: a blank field means "no goal for this one".

export type Goals = {
  calorie_goal: number;
  protein_goal_g: number | null;
  carb_goal_g: number | null;
  fat_goal_g: number | null;
  weekly_run_miles: number | null;
  weekly_cycle_miles: number | null;
  weekly_swim_yards: number | null;
  target_weight_lb: number | null;
};

export type GoalsResult = { ok: true; values: Goals } | { ok: false; message: string };

// These limits match the CHECK rules in the profiles table.
export const GOAL_LIMITS = {
  calorie_goal: { min: 500, max: 10000 },
  protein_goal_g: { min: 1, max: 1000 },
  carb_goal_g: { min: 1, max: 2000 },
  fat_goal_g: { min: 1, max: 1000 },
  weekly_run_miles: { min: 0.1, max: 500 },
  weekly_cycle_miles: { min: 0.1, max: 500 },
  weekly_swim_yards: { min: 1, max: 100000 },
  target_weight_lb: { min: 70, max: 500 },
} as const;

// Blank -> null; a number in range -> the whole number; anything else -> "invalid".
function readGoal(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
): number | null | "invalid" {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return "invalid";
  const rounded = Math.round(n);
  return rounded < min || rounded > max ? "invalid" : rounded;
}

// Like readGoal, but keeps up to 2 decimals (for miles) and accepts "12,5" too.
function readDecimalGoal(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
): number | null | "invalid" {
  const text = typeof raw === "string" ? raw.trim().replace(",", ".") : "";
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return "invalid";
  const rounded = Math.round(n * 100) / 100;
  return rounded < min || rounded > max ? "invalid" : rounded;
}

// Like readDecimalGoal, but keeps one decimal (a weight like 175.5).
function readWeightGoal(raw: FormDataEntryValue | null): number | null | "invalid" {
  const text = typeof raw === "string" ? raw.trim().replace(",", ".") : "";
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return "invalid";
  const rounded = Math.round(n * 10) / 10;
  const { min, max } = GOAL_LIMITS.target_weight_lb;
  return rounded < min || rounded > max ? "invalid" : rounded;
}

// Never trust the browser: this runs on the server before anything is saved.
export function parseGoalsForm(formData: FormData): GoalsResult {
  const { calorie_goal: cal } = GOAL_LIMITS;
  const calories = readGoal(formData.get("calorie_goal"), cal.min, cal.max);
  if (calories === null || calories === "invalid") {
    return {
      ok: false,
      message: `Enter a daily calorie goal between ${cal.min.toLocaleString("en-US")} and ${cal.max.toLocaleString("en-US")}.`,
    };
  }

  const macros = { protein_goal_g: null, carb_goal_g: null, fat_goal_g: null } as Omit<
    Goals,
    "calorie_goal"
  >;
  for (const key of ["protein_goal_g", "carb_goal_g", "fat_goal_g"] as const) {
    const { min, max } = GOAL_LIMITS[key];
    const value = readGoal(formData.get(key), min, max);
    if (value === "invalid") {
      return {
        ok: false,
        message: `Macro goals must be whole grams from ${min} to ${max.toLocaleString("en-US")}, or left blank.`,
      };
    }
    macros[key] = value;
  }

  // Weekly cardio distance goals (run and cycle in miles, swim in yards).
  const run = readDecimalGoal(formData.get("weekly_run_miles"), GOAL_LIMITS.weekly_run_miles.min, GOAL_LIMITS.weekly_run_miles.max);
  const cycle = readDecimalGoal(formData.get("weekly_cycle_miles"), GOAL_LIMITS.weekly_cycle_miles.min, GOAL_LIMITS.weekly_cycle_miles.max);
  if (run === "invalid" || cycle === "invalid") {
    return { ok: false, message: "Weekly run and cycle goals must be between 0.1 and 500 miles, or left blank." };
  }
  const swim = readGoal(formData.get("weekly_swim_yards"), GOAL_LIMITS.weekly_swim_yards.min, GOAL_LIMITS.weekly_swim_yards.max);
  if (swim === "invalid") {
    return { ok: false, message: "The weekly swim goal must be whole yards from 1 to 100,000, or left blank." };
  }

  const targetWeight = readWeightGoal(formData.get("target_weight_lb"));
  if (targetWeight === "invalid") {
    return { ok: false, message: "Target weight must be between 70 and 500 lb, or left blank." };
  }

  return {
    ok: true,
    values: {
      calorie_goal: calories,
      ...macros,
      weekly_run_miles: run,
      weekly_cycle_miles: cycle,
      weekly_swim_yards: swim,
      target_weight_lb: targetWeight,
    },
  };
}

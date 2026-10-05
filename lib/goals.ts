// Daily goals from the Settings form. The calorie goal is required (it drives
// the green/red date circle); the three macro goals are optional, and a blank
// field means "no goal for this one".

export type Goals = {
  calorie_goal: number;
  protein_goal_g: number | null;
  carb_goal_g: number | null;
  fat_goal_g: number | null;
};

export type GoalsResult = { ok: true; values: Goals } | { ok: false; message: string };

// These limits match the CHECK rules in the profiles table.
export const GOAL_LIMITS = {
  calorie_goal: { min: 500, max: 10000 },
  protein_goal_g: { min: 1, max: 1000 },
  carb_goal_g: { min: 1, max: 2000 },
  fat_goal_g: { min: 1, max: 1000 },
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

  return { ok: true, values: { calorie_goal: calories, ...macros } };
}

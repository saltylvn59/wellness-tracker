import { isValidDateKey } from "./dates";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

// The nutrition facts shared by logged foods and saved foods.
export type Nutrition = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

// One row of the food_entries table.
export type FoodEntry = Nutrition & {
  id: string;
  entry_date: string; // "YYYY-MM-DD"
  meal_type: MealType;
  source: "manual" | "text" | "photo";
};

// One row of the saved_foods table (your personal library).
export type SavedFood = Nutrition & { id: string };

export type Totals = { calories: number; protein_g: number; carbs_g: number; fat_g: number };

export function sumEntries(entries: Pick<FoodEntry, keyof Totals>[]): Totals {
  return entries.reduce<Totals>(
    (sum, e) => ({
      calories: sum.calories + e.calories,
      protein_g: sum.protein_g + e.protein_g,
      carbs_g: sum.carbs_g + e.carbs_g,
      fat_g: sum.fat_g + e.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export type NutritionResult = { ok: true; values: Nutrition } | { ok: false; message: string };

export type FoodValues = Nutrition & { entry_date: string; meal_type: MealType };
export type ParseResult = { ok: true; values: FoodValues } | { ok: false; message: string };

// Reads a number from a form field. Blank -> `blank` (or an error if null),
// otherwise it must be a number inside [min, max]. Decimals are rounded,
// because AI estimates (coming later) are rough anyway.
function readNumber(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
  blank: number | null,
): number | null | "invalid" {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text === "") return blank;
  const n = Number(text);
  if (!Number.isFinite(n)) return "invalid";
  const rounded = Math.round(n);
  return rounded < min || rounded > max ? "invalid" : rounded;
}

// Checks the name, calories, and macros. Used by both logging a food and
// saving one to your library. Never trust the browser: this runs on the server.
export function parseNutritionForm(formData: FormData): NutritionResult {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 200) {
    return { ok: false, message: "Enter a name (up to 200 characters)." };
  }

  const calories = readNumber(formData.get("calories"), 0, 10000, null);
  if (calories === null || calories === "invalid") {
    return { ok: false, message: "Calories must be a number from 0 to 10,000." };
  }

  const macros: Record<"protein_g" | "carbs_g" | "fat_g", number> = {
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };
  for (const key of ["protein_g", "carbs_g", "fat_g"] as const) {
    const value = readNumber(formData.get(key), 0, 1000, 0);
    if (value === null || value === "invalid") {
      return { ok: false, message: "Protein, carbs, and fat must be 0 to 1,000 grams." };
    }
    macros[key] = value;
  }

  return { ok: true, values: { name, calories, ...macros } };
}

// Everything above, plus which meal and which day.
export function parseFoodForm(formData: FormData): ParseResult {
  const nutrition = parseNutritionForm(formData);
  if (!nutrition.ok) return nutrition;

  const meal = String(formData.get("meal_type") ?? "");
  if (!(MEAL_TYPES as readonly string[]).includes(meal)) {
    return { ok: false, message: "Choose a meal." };
  }

  const entryDate = String(formData.get("entry_date") ?? "");
  if (!isValidDateKey(entryDate)) {
    return { ok: false, message: "Choose a valid date." };
  }

  return {
    ok: true,
    values: { ...nutrition.values, entry_date: entryDate, meal_type: meal as MealType },
  };
}

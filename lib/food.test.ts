import { describe, expect, it } from "vitest";
import { parseFoodForm, sumEntries } from "./food";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = {
  name: "Chicken burrito",
  meal_type: "lunch",
  entry_date: "2026-10-05",
  calories: "650",
  protein_g: "40",
  carbs_g: "70",
  fat_g: "20",
};

describe("parseFoodForm", () => {
  it("accepts a complete entry", () => {
    expect(parseFoodForm(form(valid))).toEqual({
      ok: true,
      values: {
        name: "Chicken burrito",
        meal_type: "lunch",
        entry_date: "2026-10-05",
        calories: 650,
        protein_g: 40,
        carbs_g: 70,
        fat_g: 20,
      },
    });
  });

  it("treats blank macros as 0 and trims the name", () => {
    const result = parseFoodForm(
      form({ ...valid, name: "  Apple  ", protein_g: "", carbs_g: " ", fat_g: "" }),
    );
    expect(result.ok && result.values).toMatchObject({
      name: "Apple",
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    });
  });

  it("rounds decimals", () => {
    const result = parseFoodForm(form({ ...valid, calories: "249.6", protein_g: "12.4" }));
    expect(result.ok && result.values).toMatchObject({ calories: 250, protein_g: 12 });
  });

  it("requires a name", () => {
    expect(parseFoodForm(form({ ...valid, name: "   " })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, name: "x".repeat(201) })).ok).toBe(false);
  });

  it("requires calories, within range", () => {
    expect(parseFoodForm(form({ ...valid, calories: "" })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, calories: "-5" })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, calories: "10001" })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, calories: "lots" })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, calories: "0" })).ok).toBe(true);
  });

  it("limits macros to 0-1000 grams", () => {
    expect(parseFoodForm(form({ ...valid, fat_g: "1001" })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, protein_g: "-1" })).ok).toBe(false);
  });

  it("rejects an unknown meal or a bad date", () => {
    expect(parseFoodForm(form({ ...valid, meal_type: "brunch" })).ok).toBe(false);
    expect(parseFoodForm(form({ ...valid, entry_date: "2026-02-30" })).ok).toBe(false);
  });
});

describe("sumEntries", () => {
  it("adds up calories and macros", () => {
    expect(
      sumEntries([
        { calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10 },
        { calories: 450, protein_g: 5, carbs_g: 60, fat_g: 15 },
      ]),
    ).toEqual({ calories: 750, protein_g: 25, carbs_g: 90, fat_g: 25 });
  });

  it("returns zeros for an empty day", () => {
    expect(sumEntries([])).toEqual({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  });
});

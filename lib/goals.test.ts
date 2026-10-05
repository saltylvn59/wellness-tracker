import { describe, expect, it } from "vitest";
import { parseGoalsForm } from "./goals";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseGoalsForm", () => {
  it("accepts all four goals", () => {
    expect(
      parseGoalsForm(
        form({ calorie_goal: "2200", protein_goal_g: "160", carb_goal_g: "220", fat_goal_g: "70" }),
      ),
    ).toEqual({
      ok: true,
      values: { calorie_goal: 2200, protein_goal_g: 160, carb_goal_g: 220, fat_goal_g: 70 },
    });
  });

  it("treats blank macro goals as 'no goal' (null)", () => {
    const result = parseGoalsForm(
      form({ calorie_goal: "2000", protein_goal_g: "150", carb_goal_g: "", fat_goal_g: "  " }),
    );
    expect(result).toEqual({
      ok: true,
      values: { calorie_goal: 2000, protein_goal_g: 150, carb_goal_g: null, fat_goal_g: null },
    });
  });

  it("accepts a calorie goal alone", () => {
    const result = parseGoalsForm(form({ calorie_goal: "1800" }));
    expect(result.ok && result.values).toEqual({
      calorie_goal: 1800,
      protein_goal_g: null,
      carb_goal_g: null,
      fat_goal_g: null,
    });
  });

  it("rounds decimals", () => {
    const result = parseGoalsForm(form({ calorie_goal: "2000.4", protein_goal_g: "149.6" }));
    expect(result.ok && result.values).toMatchObject({ calorie_goal: 2000, protein_goal_g: 150 });
  });

  it("requires a calorie goal in range", () => {
    expect(parseGoalsForm(form({})).ok).toBe(false);
    expect(parseGoalsForm(form({ calorie_goal: "" })).ok).toBe(false);
    expect(parseGoalsForm(form({ calorie_goal: "499" })).ok).toBe(false);
    expect(parseGoalsForm(form({ calorie_goal: "10001" })).ok).toBe(false);
    expect(parseGoalsForm(form({ calorie_goal: "lots" })).ok).toBe(false);
  });

  it("rejects macro goals that are out of range or not numbers", () => {
    const base = { calorie_goal: "2000" };
    expect(parseGoalsForm(form({ ...base, protein_goal_g: "0" })).ok).toBe(false);
    expect(parseGoalsForm(form({ ...base, protein_goal_g: "1001" })).ok).toBe(false);
    expect(parseGoalsForm(form({ ...base, carb_goal_g: "2001" })).ok).toBe(false);
    expect(parseGoalsForm(form({ ...base, carb_goal_g: "2000" })).ok).toBe(true);
    expect(parseGoalsForm(form({ ...base, fat_goal_g: "-5" })).ok).toBe(false);
    expect(parseGoalsForm(form({ ...base, fat_goal_g: "some" })).ok).toBe(false);
  });
});

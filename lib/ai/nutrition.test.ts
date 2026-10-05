import { describe, expect, it } from "vitest";
import { parseAiNutrition } from "./nutrition";

const good = {
  is_food: true,
  name: "Greek yogurt with berries",
  calories: 180,
  protein_g: 15,
  carbs_g: 22,
  fat_g: 4,
  confidence: "medium",
  notes: "Assumed a 170 g cup.",
};

describe("parseAiNutrition", () => {
  it("accepts a good reply, as a JSON string or an object", () => {
    const expected = {
      ok: true,
      estimate: {
        name: "Greek yogurt with berries",
        calories: 180,
        protein_g: 15,
        carbs_g: 22,
        fat_g: 4,
        confidence: "medium",
        notes: "Assumed a 170 g cup.",
      },
    };
    expect(parseAiNutrition(JSON.stringify(good))).toEqual(expected);
    expect(parseAiNutrition(good)).toEqual(expected);
  });

  it("tolerates a code fence around the JSON", () => {
    const fenced = "```json\n" + JSON.stringify(good) + "\n```";
    expect(parseAiNutrition(fenced).ok).toBe(true);
  });

  it("rounds decimals and accepts numbers sent as strings", () => {
    const result = parseAiNutrition({ ...good, calories: "180.6", protein_g: 14.5, fat_g: 3.4 });
    expect(result.ok && result.estimate).toMatchObject({ calories: 181, protein_g: 15, fat_g: 3 });
  });

  it("reports non-food input", () => {
    const result = parseAiNutrition({ ...good, is_food: false, calories: 0 });
    expect(result).toMatchObject({ ok: false, reason: "not_food" });
  });

  it("rejects text that isn't JSON, and non-object JSON", () => {
    expect(parseAiNutrition("sorry, I can't help")).toMatchObject({ ok: false, reason: "bad_response" });
    expect(parseAiNutrition("[1,2,3]")).toMatchObject({ ok: false, reason: "bad_response" });
    expect(parseAiNutrition(undefined)).toMatchObject({ ok: false, reason: "bad_response" });
    expect(parseAiNutrition(null)).toMatchObject({ ok: false, reason: "bad_response" });
  });

  it("rejects missing or non-numeric fields", () => {
    expect(parseAiNutrition({ ...good, name: "  " }).ok).toBe(false);
    expect(parseAiNutrition({ ...good, calories: undefined }).ok).toBe(false);
    expect(parseAiNutrition({ ...good, protein_g: "lots" }).ok).toBe(false);
    expect(parseAiNutrition({ ...good, carbs_g: NaN }).ok).toBe(false);
  });

  it("rejects numbers outside sensible limits", () => {
    expect(parseAiNutrition({ ...good, calories: 10001 }).ok).toBe(false);
    expect(parseAiNutrition({ ...good, calories: -5 }).ok).toBe(false);
    expect(parseAiNutrition({ ...good, fat_g: 1001 }).ok).toBe(false);
    expect(parseAiNutrition({ ...good, protein_g: -1 }).ok).toBe(false);
  });

  it("defaults an unknown confidence to medium and trims long text", () => {
    const result = parseAiNutrition({
      ...good,
      confidence: "certain",
      name: "x".repeat(300),
      notes: "n".repeat(500),
    });
    expect(result.ok && result.estimate.confidence).toBe("medium");
    expect(result.ok && result.estimate.name.length).toBe(100);
    expect(result.ok && result.estimate.notes.length).toBe(200);
  });
});

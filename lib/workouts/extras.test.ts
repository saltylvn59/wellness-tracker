import { describe, expect, it } from "vitest";
import {
  defaultSaunaMinutes,
  SAUNA_DEFAULT,
  SAUNA_OPTIONS,
  STRETCH_MINUTES,
  validateSaunaMinutes,
} from "./extras";

describe("sauna wheel options", () => {
  it("runs 5 to 30 minutes, one minute at a time", () => {
    expect(SAUNA_OPTIONS[0]).toBe(5);
    expect(SAUNA_OPTIONS.at(-1)).toBe(30);
    expect(SAUNA_OPTIONS).toHaveLength(26);
    expect(SAUNA_OPTIONS).toContain(10);
  });

  it("defaults to 10 minutes", () => {
    expect(SAUNA_DEFAULT).toBe(10);
    expect(SAUNA_OPTIONS).toContain(SAUNA_DEFAULT);
    expect(defaultSaunaMinutes()).toBe(10);
    expect(defaultSaunaMinutes(null)).toBe(10);
  });

  it("starts at today's logged minutes when editing", () => {
    expect(defaultSaunaMinutes(15)).toBe(15);
    expect(defaultSaunaMinutes(5)).toBe(5);
    expect(defaultSaunaMinutes(30)).toBe(30);
  });

  it("keeps odd stored values on the wheel", () => {
    expect(defaultSaunaMinutes(2)).toBe(5);
    expect(defaultSaunaMinutes(99)).toBe(30);
    expect(defaultSaunaMinutes(12.5)).toBe(10); // not a whole number: fall back to the default
  });
});

describe("stretch", () => {
  it("is a fixed 10 minutes", () => {
    expect(STRETCH_MINUTES).toBe(10);
  });
});

describe("validateSaunaMinutes", () => {
  it("accepts 5 to 30 whole minutes", () => {
    for (const minutes of [5, 10, 17, 30]) {
      expect(validateSaunaMinutes(minutes)).toEqual({ ok: true, minutes });
    }
  });

  it("rejects everything else", () => {
    for (const bad of [4, 31, 0, -10, 10.5, NaN, Infinity, "10", null, undefined]) {
      expect(validateSaunaMinutes(bad).ok).toBe(false);
    }
  });
});

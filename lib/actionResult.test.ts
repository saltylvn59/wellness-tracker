import { describe, expect, it } from "vitest";
import { DATABASE_BEHIND_MESSAGE } from "./dbErrors";
import { currentUserId, failedSave, SAVE_FAILED } from "./actionResult";

describe("failedSave", () => {
  it("explains a missing SQL step", () => {
    for (const code of ["42703", "42P01", "PGRST204", "PGRST205"]) {
      expect(failedSave({ code })).toEqual({ ok: false, message: DATABASE_BEHIND_MESSAGE });
    }
  });

  it("gives the plain message for any other failure", () => {
    expect(failedSave({ code: "23505" })).toBe(SAVE_FAILED);
    expect(failedSave(null)).toBe(SAVE_FAILED);
  });
});

describe("currentUserId", () => {
  const clientWith = (data: unknown) => ({ auth: { getClaims: async () => ({ data }) } }) as never;

  it("returns the signed-in user's id", async () => {
    expect(await currentUserId(clientWith({ claims: { sub: "user-1" } }))).toBe("user-1");
  });

  it("returns null when nobody is signed in", async () => {
    expect(await currentUserId(clientWith(null))).toBeNull();
  });
});

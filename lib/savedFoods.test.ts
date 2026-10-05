import { describe, expect, it } from "vitest";
import { escapeLike } from "./savedFoods";

describe("escapeLike", () => {
  it("leaves ordinary names alone", () => {
    expect(escapeLike("Banana")).toBe("Banana");
    expect(escapeLike("Greek yogurt with berries")).toBe("Greek yogurt with berries");
  });

  it("escapes the wildcard characters % and _", () => {
    expect(escapeLike("100% juice")).toBe("100\\% juice");
    expect(escapeLike("protein_bar")).toBe("protein\\_bar");
  });

  it("escapes backslashes first so nothing is double-processed", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
    expect(escapeLike("50%\\")).toBe("50\\%\\\\");
  });
});

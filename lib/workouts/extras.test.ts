import { describe, expect, it } from "vitest";
import { EXTRAS, parseExtraKind } from "./extras";

describe("EXTRAS", () => {
  it("sauna and stretch are each 10 minutes", () => {
    expect(EXTRAS.sauna.minutes).toBe(10);
    expect(EXTRAS.stretch.minutes).toBe(10);
  });

  it("sauna starts the workout and stretch ends it", () => {
    expect(EXTRAS.sauna.when).toBe("start of workout");
    expect(EXTRAS.stretch.when).toBe("end of workout");
  });

  it("each one has its own database column", () => {
    expect(EXTRAS.sauna.column).toBe("sauna_done");
    expect(EXTRAS.stretch.column).toBe("stretch_done");
  });
});

describe("parseExtraKind", () => {
  it("accepts only sauna and stretch", () => {
    expect(parseExtraKind("sauna")).toBe("sauna");
    expect(parseExtraKind("stretch")).toBe("stretch");
  });

  it("rejects anything else, so the browser can't pick a column", () => {
    for (const bad of ["Sauna", "user_id", "sauna_done; drop table", "", null, undefined, 5, {}]) {
      expect(parseExtraKind(bad)).toBeNull();
    }
  });
});

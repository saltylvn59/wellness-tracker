import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDayNumber,
  formatFullDate,
  formatShortMonth,
  formatWeekday,
  getLocalDateKey,
  isValidDateKey,
  weekDays,
} from "./dates";

describe("isValidDateKey", () => {
  it("accepts real dates", () => {
    expect(isValidDateKey("2026-10-05")).toBe(true);
    expect(isValidDateKey("2028-02-29")).toBe(true); // leap year
  });

  it("rejects impossible or badly formatted dates", () => {
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2027-02-29")).toBe(false); // not a leap year
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("2026-1-5")).toBe(false);
    expect(isValidDateKey("tomorrow")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
  });
});

describe("addDays", () => {
  it("moves forward and backward", () => {
    expect(addDays("2026-10-05", 1)).toBe("2026-10-06");
    expect(addDays("2026-10-05", -1)).toBe("2026-10-04");
  });

  it("crosses month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("weekDays", () => {
  it("lists Sunday through Saturday by default", () => {
    // Oct 5, 2026 is a Monday
    expect(weekDays("2026-10-05")).toEqual([
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
    ]);
  });

  it("gives the same week for every day in it", () => {
    const week = weekDays("2026-10-05");
    for (const day of week) expect(weekDays(day)).toEqual(week);
  });

  it("starts a new week on Sunday", () => {
    expect(weekDays("2026-10-04")[0]).toBe("2026-10-04"); // a Sunday
    expect(weekDays("2026-10-10")[6]).toBe("2026-10-10"); // the Saturday before
    expect(weekDays("2026-10-11")[0]).toBe("2026-10-11"); // next Sunday
  });

  it("can start on Monday instead", () => {
    expect(weekDays("2026-10-05", 1)[0]).toBe("2026-10-05"); // Monday
    expect(weekDays("2026-10-04", 1)).toEqual(weekDays("2026-09-29", 1)); // Sunday ends its week
    expect(weekDays("2026-10-04", 1)[6]).toBe("2026-10-04");
  });

  it("crosses month and year boundaries", () => {
    expect(weekDays("2026-12-31")).toEqual([
      "2026-12-27",
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});

describe("getLocalDateKey", () => {
  it("uses the local calendar date, not UTC", () => {
    // Built from local parts, so this holds in any time zone the tests run in.
    const lateEvening = new Date(2026, 9, 5, 23, 30); // Oct 5, 11:30pm local
    expect(getLocalDateKey(lateEvening)).toBe("2026-10-05");
    const justAfterMidnight = new Date(2026, 9, 6, 0, 5);
    expect(getLocalDateKey(justAfterMidnight)).toBe("2026-10-06");
  });
});

describe("formatting", () => {
  it("prints the same text everywhere", () => {
    expect(formatWeekday("2026-10-05")).toBe("Monday");
    expect(formatShortMonth("2026-10-05")).toBe("Oct");
    expect(formatDayNumber("2026-10-05")).toBe("5");
    expect(formatFullDate("2026-10-05")).toBe("Oct 5, 2026");
  });
});

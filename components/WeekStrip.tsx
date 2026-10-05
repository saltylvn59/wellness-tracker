import Link from "next/link";
import { formatDayNumber, formatFullDate, formatWeekdayShort } from "@/lib/dates";
import { getGoalStatus } from "@/lib/goalStatus";

export type WeekDay = { dateKey: string; calories: number; hasEntries: boolean };

// The whole week at a glance: day name + date number, with a ring that is
// green (at/under goal) or red (over goal) for days that have food logged.
// Tap a day to jump to it. The selected day is highlighted.
export default function WeekStrip({
  days,
  selected,
  goal,
}: {
  days: WeekDay[];
  selected: string;
  goal: number | null;
}) {
  return (
    <nav aria-label="Week" className="flex gap-1">
      {days.map((day) => {
        const isSelected = day.dateKey === selected;
        const status = day.hasEntries ? getGoalStatus(day.calories, goal) : null;
        const ring =
          status === "under"
            ? "border-accent"
            : status === "over"
              ? "border-danger"
              : status === "none"
                ? "border-muted"
                : "border-transparent";

        return (
          <Link
            key={day.dateKey}
            href={`/food?date=${day.dateKey}`}
            aria-current={isSelected ? "date" : undefined}
            aria-label={formatFullDate(day.dateKey)}
            className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 active:opacity-70 ${
              isSelected ? "bg-card" : ""
            }`}
          >
            <span className={`text-xs ${isSelected ? "font-semibold text-foreground" : "text-muted"}`}>
              {formatWeekdayShort(day.dateKey)}
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base ${ring} ${
                isSelected ? "font-bold" : "font-medium"
              }`}
            >
              {formatDayNumber(day.dateKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

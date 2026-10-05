import Link from "next/link";
import { formatDayNumber, formatFullDate, formatWeekdayShort } from "@/lib/dates";
import type { DayKind } from "@/lib/workouts/defaults";

export type WorkoutStripDay = { dateKey: string; kind: DayKind | null };

const KIND_ICON: Record<DayKind, string> = { lift: "🏋️", cardio: "🏃", rest: "😴" };
const KIND_NAME: Record<DayKind, string> = { lift: "Lifting", cardio: "Cardio", rest: "Rest" };

// The week at a glance: day name, date number, and what kind of day it is.
// Tap a day to see its plan. The selected day is highlighted.
export default function WorkoutWeekStrip({
  days,
  selected,
}: {
  days: WorkoutStripDay[];
  selected: string;
}) {
  return (
    <nav aria-label="Week" className="flex gap-1">
      {days.map((day) => {
        const isSelected = day.dateKey === selected;
        return (
          <Link
            key={day.dateKey}
            href={`/workouts?date=${day.dateKey}`}
            aria-current={isSelected ? "date" : undefined}
            aria-label={`${formatFullDate(day.dateKey)}${day.kind ? `, ${KIND_NAME[day.kind]}` : ""}`}
            className={`flex min-h-20 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 active:opacity-70 ${
              isSelected ? "bg-card" : ""
            }`}
          >
            <span className={`text-xs ${isSelected ? "font-semibold text-foreground" : "text-muted"}`}>
              {formatWeekdayShort(day.dateKey)}
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${
                isSelected ? "bg-accent font-bold text-on-accent" : "font-medium"
              }`}
            >
              {formatDayNumber(day.dateKey)}
            </span>
            <span className="text-base leading-none" aria-hidden="true">
              {day.kind ? KIND_ICON[day.kind] : ""}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

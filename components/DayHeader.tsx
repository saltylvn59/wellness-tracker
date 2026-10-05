import Link from "next/link";
import TodayPill from "@/components/TodayPill";
import {
  addDays,
  formatDayNumber,
  formatFullDate,
  formatShortMonth,
  formatWeekday,
} from "@/lib/dates";
import type { GoalStatus } from "@/lib/goalStatus";

const RING: Record<GoalStatus, string> = {
  under: "border-accent", // green: at or under your calorie goal
  over: "border-danger", // red: over your calorie goal
  none: "border-muted", // grey: no goal set yet
};

const STATUS_TEXT: Record<GoalStatus, string> = {
  under: "Within your calorie goal",
  over: "Over your calorie goal",
  none: "No calorie goal set",
};

const arrowClass =
  "flex h-12 w-12 items-center justify-center rounded-full text-3xl text-muted active:bg-card";

export default function DayHeader({ dateKey, status }: { dateKey: string; status: GoalStatus }) {
  return (
    <header>
      <div className="flex items-center justify-between">
        <TodayPill dateKey={dateKey} />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl active:bg-card"
        >
          ⚙️
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Link href={`/food?date=${addDays(dateKey, -1)}`} aria-label="Previous day" className={arrowClass}>
          ‹
        </Link>

        <div className="flex flex-col items-center gap-2">
          <div
            role="img"
            aria-label={`${formatFullDate(dateKey)}. ${STATUS_TEXT[status]}.`}
            className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-[6px] ${RING[status]}`}
          >
            <span className="text-xs font-medium uppercase leading-none text-muted">
              {formatShortMonth(dateKey)}
            </span>
            <span className="text-3xl font-bold leading-tight">{formatDayNumber(dateKey)}</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold leading-tight">{formatWeekday(dateKey)}</p>
            <p className="text-sm text-muted">{formatFullDate(dateKey)}</p>
          </div>
        </div>

        <Link href={`/food?date=${addDays(dateKey, 1)}`} aria-label="Next day" className={arrowClass}>
          ›
        </Link>
      </div>
    </header>
  );
}

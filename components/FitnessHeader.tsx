import Link from "next/link";
import FitnessSwitch from "@/components/FitnessSwitch";
import StreakBadge from "@/components/StreakBadge";
import TodayPill from "@/components/TodayPill";
import WorkoutWeekStrip from "@/components/WorkoutWeekStrip";
import { addDays, isoWeekday, weekDays } from "@/lib/dates";
import type { WorkoutDay } from "@/lib/workouts/plan";

const arrowClass =
  "flex h-11 w-11 items-center justify-center rounded-full text-2xl text-muted active:bg-card";

// The top of both Fitness pages (Lifting and Cardio): title, the Lifting | Cardio
// switch, your streak, and the week strip with a green ring on days you logged.
export default function FitnessHeader({
  current,
  date,
  days,
  doneDates,
}: {
  current: "lifting" | "cardio";
  date: string;
  days: WorkoutDay[]; // your weekly plan
  doneDates: string[]; // dates you logged a workout or cardio
}) {
  const basePath = current === "lifting" ? "/workouts" : "/cardio";
  const byWeekday = new Map(days.map((d) => [d.weekday, d]));
  const done = new Set(doneDates);
  const restWeekdays = days.filter((d) => d.kind === "rest").map((d) => d.weekday);

  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fitness</h1>
        <TodayPill dateKey={date} href={basePath} />
      </div>

      <FitnessSwitch current={current} date={date} />

      <StreakBadge doneDates={doneDates} restWeekdays={restWeekdays} />

      <div className="flex items-center gap-1">
        <Link href={`${basePath}?date=${addDays(date, -7)}`} aria-label="Previous week" className={arrowClass}>
          ‹
        </Link>
        <div className="min-w-0 flex-1">
          <WorkoutWeekStrip
            selected={date}
            basePath={basePath}
            days={weekDays(date).map((dateKey) => ({
              dateKey,
              kind: byWeekday.get(isoWeekday(dateKey))?.kind ?? null,
              done: done.has(dateKey),
            }))}
          />
        </div>
        <Link href={`${basePath}?date=${addDays(date, 7)}`} aria-label="Next week" className={arrowClass}>
          ›
        </Link>
      </div>
    </header>
  );
}

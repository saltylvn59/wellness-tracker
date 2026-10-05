"use client";

import { useSyncExternalStore } from "react";
import { getLocalDateKey } from "@/lib/dates";
import { computeStreak, milestoneMessage, nextMilestone } from "@/lib/streak";

const noSubscribe = () => () => {};

// Your workout streak. It needs to know today's date on YOUR phone, so it works
// it out in the browser and shows a placeholder-sized blank until then.
export default function StreakBadge({
  doneDates,
  restWeekdays,
}: {
  doneDates: string[];
  restWeekdays: number[]; // 1 = Monday ... 7 = Sunday
}) {
  const today = useSyncExternalStore(noSubscribe, getLocalDateKey, () => null);
  if (!today) return <div className="h-[72px]" aria-hidden="true" />; // keeps the layout steady

  const { current, longest, doneToday } = computeStreak(doneDates, today, new Set(restWeekdays));
  const celebration = milestoneMessage(current);
  const next = nextMilestone(current);

  return (
    <section
      aria-label="Workout streak"
      className={`rounded-2xl px-4 py-3 ${current > 0 ? "bg-accent text-on-accent" : "bg-card"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold">
          <span aria-hidden="true">🔥</span>{" "}
          {current > 0 ? `${current}-day streak` : "No streak yet"}
        </p>
        <p className={`text-sm font-medium ${current > 0 ? "opacity-90" : "text-muted"}`}>
          Best: {longest}
        </p>
      </div>
      <p className={`mt-0.5 text-sm ${current > 0 ? "opacity-90" : "text-muted"}`}>
        {celebration ??
          (current === 0
            ? "Log a workout or cardio today to start one."
            : !doneToday
              ? "Log today to keep it going."
              : next
                ? `${next - current} more ${next - current === 1 ? "day" : "days"} to ${next}.`
                : "Incredible consistency!")}
      </p>
    </section>
  );
}

import Link from "next/link";
import { CARDIO, CARDIO_KINDS, formatDistance } from "@/lib/cardio";
import { goalProgress, type WeeklyGoals } from "@/lib/cardioGoals";

// "This week" progress toward your weekly distance goals, shown on cardio days.
// Run and cycle show up while they have a goal; swim shows once it has a goal
// or you've swum this week. The bars stay green; reaching a goal gets a 🎯.
export default function WeeklyCardioGoals({
  totals,
  goals,
}: {
  totals: Record<"run" | "cycle" | "swim", number>;
  goals: WeeklyGoals;
}) {
  const rows = CARDIO_KINDS.filter((kind) => goals[kind] !== null || totals[kind] > 0);

  return (
    <section className="space-y-3 rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">This week</h3>
        <Link href="/settings" className="flex min-h-11 items-center text-sm font-medium text-accent active:opacity-70">
          Edit goals
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          No weekly goals set. Add some in{" "}
          <Link href="/settings" className="font-medium text-accent underline">
            Settings
          </Link>
          .
        </p>
      ) : (
        rows.map((kind) => {
          const { unit, label, icon } = CARDIO[kind];
          const goal = goals[kind];
          const progress = goalProgress(totals[kind], goal);
          return (
            <div key={kind}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-medium">
                  <span aria-hidden="true">{icon}</span> {label}
                </p>
                <p className="text-sm tabular-nums">
                  <span className="font-semibold">{formatDistance(totals[kind], unit)}</span>
                  {goal !== null && <span className="text-muted"> / {formatDistance(goal, unit)}</span>}
                </p>
              </div>
              {progress && (
                <>
                  <div
                    role="progressbar"
                    aria-label={`${label} distance toward weekly goal`}
                    aria-valuemin={0}
                    aria-valuemax={goal ?? 0}
                    aria-valuenow={totals[kind]}
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-border"
                  >
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <p className={`mt-1 text-xs ${progress.reached ? "font-semibold text-accent" : "text-muted"}`}>
                    {progress.reached
                      ? "🎯 Goal reached!"
                      : `${formatDistance(progress.remaining, unit)} to go`}
                  </p>
                </>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

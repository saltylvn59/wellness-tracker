import { formatWeight } from "@/lib/workouts/logging";
import { THREE_REP_MAX_LIFTS } from "@/lib/workouts/maxes";

// Shown at the top of the lifting days: your current 3-rep max for three key lifts.
// Each is the heaviest weight you've logged for 3 or more reps.
export default function ThreeRepMaxes({ maxes }: { maxes: (number | null)[] }) {
  return (
    <section aria-label="3-rep maxes" className="rounded-2xl bg-card p-4">
      <h3 className="text-sm font-semibold text-muted">
        <span aria-hidden="true">🏆</span> 3-rep maxes
      </h3>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {THREE_REP_MAX_LIFTS.map((lift, index) => {
          const max = maxes[index] ?? null;
          return (
            <div key={lift.label} className="min-w-0">
              <p className="truncate text-xs text-muted">{lift.label}</p>
              <p className="text-xl font-bold tabular-nums">
                {max === null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <>
                    {formatWeight(max)} <span className="text-sm font-medium text-muted">lb</span>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Heaviest weight logged for 3+ reps.</p>
    </section>
  );
}

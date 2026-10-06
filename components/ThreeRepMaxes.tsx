import { formatWeight } from "@/lib/workouts/logging";
import { THREE_REP_MAX_LIFTS } from "@/lib/workouts/maxes";

// A slim row at the top of the lifting days: your current 3-rep max for three key lifts.
// Each is the heaviest weight you've logged for 3 or more reps.
export default function ThreeRepMaxes({ maxes }: { maxes: (number | null)[] }) {
  return (
    <section
      aria-label="3-rep maxes"
      title="Heaviest weight logged for 3+ reps"
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-1.5"
    >
      <span className="text-base" aria-hidden="true">
        🏆
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        {THREE_REP_MAX_LIFTS.map((lift, index) => {
          const max = maxes[index] ?? null;
          return (
            <div key={lift.label} className="min-w-0">
              <p className="truncate text-xs text-muted">{lift.label}</p>
              <p className="text-base font-semibold leading-tight tabular-nums">
                {max === null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <>
                    {formatWeight(max)} <span className="text-xs font-medium text-muted">lb</span>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

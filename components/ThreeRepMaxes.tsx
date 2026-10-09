import { formatWeight } from "@/lib/workouts/logging";
import { CLUB_GOAL_LB, clubTotal, THREE_REP_MAX_LIFTS } from "@/lib/workouts/maxes";

// The #1000club card at the top of the lifting days: your current 3-rep max for bench,
// deadlift and squat (the heaviest weight logged for 3 or more reps), and their total
// against the 1,000 lb goal.
export default function ThreeRepMaxes({ maxes }: { maxes: (number | null)[] }) {
  const total = clubTotal(maxes);
  return (
    <section
      aria-label="#1000club: 3-rep maxes"
      title="Heaviest weight logged for 3+ reps"
      className="space-y-1 rounded-2xl bg-card px-4 py-2"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold">
          <span aria-hidden="true">🏆</span> #1000club
        </p>
        <p className={`text-xs tabular-nums ${total >= CLUB_GOAL_LB ? "font-semibold text-accent" : "text-muted"}`}>
          {total >= CLUB_GOAL_LB ? "🎉 " : ""}
          {formatWeight(total)} / {formatWeight(CLUB_GOAL_LB)} lb
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
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

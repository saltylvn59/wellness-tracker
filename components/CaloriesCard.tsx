import Link from "next/link";
import CalorieRing from "@/components/CalorieRing";
import type { GoalStatus } from "@/lib/goalStatus";

const fmt = (n: number) => n.toLocaleString("en-US");

// Calories for the day: the ring (green at or under your goal, red over), and next to
// it how much is left, or how far over you are. (Macros have their own card up top.)
export default function CaloriesCard({
  calories,
  goal,
  status,
}: {
  calories: number;
  goal: number | null;
  status: GoalStatus;
}) {
  return (
    <section aria-label="Calories" className="flex items-center gap-5 rounded-2xl bg-card p-4">
      <CalorieRing calories={calories} goal={goal} status={status} />
      <div className="min-w-0">
        {goal ? (
          calories > goal ? (
            <>
              <p className="text-3xl font-bold tabular-nums text-danger">{fmt(calories - goal)}</p>
              <p className="text-sm text-muted">kcal over your {fmt(goal)} goal</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{fmt(goal - calories)}</p>
              <p className="text-sm text-muted">kcal left of {fmt(goal)}</p>
            </>
          )
        ) : (
          <Link href="/settings" className="text-sm font-medium text-accent underline">
            Set a calorie goal
          </Link>
        )}
      </div>
    </section>
  );
}

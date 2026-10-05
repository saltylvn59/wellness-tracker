const fmt = (n: number) => n.toLocaleString("en-US");

// One macro for the day: a label, "eaten / goal g", and a thin bar filling toward
// the goal. With no goal set it shows just the grams. The bar stays green even past
// the goal (going over on protein isn't a problem, so it isn't flagged red).
export default function MacroRow({
  label,
  grams,
  goal,
}: {
  label: string;
  grams: number;
  goal: number | null;
}) {
  const percent = goal ? Math.min(100, (grams / goal) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums">
          <span className="text-lg font-semibold">{fmt(grams)}</span>
          <span className="text-muted">{goal ? ` / ${fmt(goal)} g` : " g"}</span>
        </span>
      </div>
      {goal ? (
        <div
          role="progressbar"
          aria-label={`${label} toward daily goal`}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={grams}
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-border"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}

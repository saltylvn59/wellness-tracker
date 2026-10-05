const fmt = (n: number) => n.toLocaleString("en-US");

// One macro for the day: "eaten / goal g" with a bar filling up toward the goal.
// With no goal set it just shows the grams eaten. The bar stays green even past
// the goal: for macros like protein, going over isn't a problem, so we don't
// flag it red the way we do for calories.
export default function MacroStat({
  label,
  grams,
  goal,
}: {
  label: string;
  grams: number;
  goal: number | null;
}) {
  const progress = goal ? Math.min(100, (grams / goal) * 100) : 0;

  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-base font-semibold">
        {fmt(grams)}
        {goal ? (
          <span className="font-normal text-muted"> / {fmt(goal)} g</span>
        ) : (
          <span className="font-normal text-muted"> g</span>
        )}
      </dd>
      {goal ? (
        <div
          role="progressbar"
          aria-label={`${label} toward daily goal`}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={grams}
          className="mx-auto mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

import Link from "next/link";

// The Lifting | Cardio switch at the top of the Fitness tab.
// `date` keeps you on the same day when you switch (it may be empty).
export default function FitnessSwitch({
  current,
  date,
}: {
  current: "lifting" | "cardio";
  date?: string;
}) {
  const query = date ? `?date=${date}` : "";
  const options = [
    { key: "lifting", label: "🏋️ Lifting", href: `/workouts${query}` },
    { key: "cardio", label: "🏃 Cardio", href: `/cardio${query}` },
  ] as const;

  return (
    <nav aria-label="Fitness" className="flex gap-1 rounded-xl bg-card p-1">
      {options.map((option) => {
        const active = option.key === current;
        return (
          <Link
            key={option.key}
            href={option.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-lg text-sm font-semibold ${
              active ? "bg-accent text-on-accent" : "text-muted active:opacity-70"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import DayHeader from "@/components/DayHeader";
import GoToToday from "@/components/GoToToday";
import { isValidDateKey } from "@/lib/dates";
import { MEAL_LABELS, MEAL_TYPES, sumEntries, type FoodEntry } from "@/lib/food";
import { getGoalStatus } from "@/lib/goalStatus";
import { createClient } from "@/lib/supabase/server";

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  // No date in the address? Let the phone work out "today" and jump there.
  if (!date || !isValidDateKey(date)) return <GoToToday />;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  // Fetch your goal and this day's entries at the same time.
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("calorie_goal").eq("id", userId).maybeSingle(),
    supabase
      .from("food_entries")
      .select("id, entry_date, meal_type, name, calories, protein_g, carbs_g, fat_g, source")
      .eq("entry_date", date)
      .order("created_at", { ascending: true }),
  ]);

  const goal: number | null = profile?.calorie_goal ?? null;
  const entries = (rows ?? []) as FoodEntry[];
  const totals = sumEntries(entries);
  const status = getGoalStatus(totals.calories, goal);
  const progress = goal ? Math.min(100, (totals.calories / goal) * 100) : 0;

  return (
    <div className="space-y-6">
      <DayHeader dateKey={date} status={status} />

      <section className="rounded-2xl bg-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold">
            {fmt(totals.calories)} <span className="text-base font-medium text-muted">kcal</span>
          </p>
          {goal && (
            <p className="text-sm text-muted">
              {totals.calories > goal ? (
                <span className="font-medium text-danger">{fmt(totals.calories - goal)} over</span>
              ) : (
                <span>{fmt(goal - totals.calories)} left</span>
              )}
            </p>
          )}
        </div>

        {goal ? (
          <>
            <div
              role="progressbar"
              aria-label="Calories toward daily goal"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={totals.calories}
              className="mt-3 h-2 overflow-hidden rounded-full bg-border"
            >
              <div
                className={`h-full rounded-full ${status === "over" ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">Daily goal: {fmt(goal)} kcal</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Daily goal not set yet.{" "}
            <Link href="/settings" className="font-medium text-accent underline">
              Set it in Settings
            </Link>
          </p>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
          {(
            [
              ["Protein", totals.protein_g],
              ["Carbs", totals.carbs_g],
              ["Fat", totals.fat_g],
            ] as const
          ).map(([label, grams]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-base font-semibold">{fmt(grams)} g</dd>
            </div>
          ))}
        </dl>
      </section>

      <Link
        href={`/food/new?date=${date}`}
        className="flex min-h-12 items-center justify-center rounded-xl bg-accent text-base font-semibold text-on-accent active:opacity-80"
      >
        + Add food
      </Link>

      {entries.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          Nothing logged for this day yet.
        </section>
      ) : (
        MEAL_TYPES.map((meal) => {
          const items = entries.filter((e) => e.meal_type === meal);
          if (items.length === 0) return null;
          const subtotal = items.reduce((sum, e) => sum + e.calories, 0);
          return (
            <section key={meal}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold">{MEAL_LABELS[meal]}</h2>
                <span className="text-sm text-muted">{fmt(subtotal)} kcal</span>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
                {items.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/food/${entry.id}`}
                      className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 active:bg-border"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium">{entry.name}</p>
                        <p className="text-xs text-muted">
                          P {entry.protein_g}g · C {entry.carbs_g}g · F {entry.fat_g}g
                        </p>
                      </div>
                      <span className="shrink-0 text-base font-semibold">{fmt(entry.calories)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

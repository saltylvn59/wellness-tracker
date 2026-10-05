import Link from "next/link";
import { redirect } from "next/navigation";
import DayHeader from "@/components/DayHeader";
import GoToToday from "@/components/GoToToday";
import MacroStat from "@/components/MacroStat";
import StreakBadge from "@/components/StreakBadge";
import WeekStrip, { type WeekDay } from "@/components/WeekStrip";
import { addDays, isValidDateKey, weekDays } from "@/lib/dates";
import { MEAL_LABELS, MEAL_TYPES, sumEntries, type FoodEntry } from "@/lib/food";
import { loadFoodLogDates } from "@/lib/foodStreak";
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

  // Fetch your goal and the whole week's entries at the same time.
  // (One query covers all 7 days: the week strip needs each day's total.)
  const week = weekDays(date);
  const [{ data: profile }, { data: rows }, foodDates] = await Promise.all([
    supabase
      .from("profiles")
      .select("calorie_goal, protein_goal_g, carb_goal_g, fat_goal_g")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("food_entries")
      .select("id, entry_date, meal_type, name, calories, protein_g, carbs_g, fat_g, source")
      .gte("entry_date", week[0])
      .lte("entry_date", week[6])
      .order("created_at", { ascending: true }),
    // Every day you've logged food, for the streak.
    loadFoodLogDates(supabase, addDays(date, -400)),
  ]);

  const goal: number | null = profile?.calorie_goal ?? null;
  const macroGoals = {
    protein: (profile?.protein_goal_g ?? null) as number | null,
    carbs: (profile?.carb_goal_g ?? null) as number | null,
    fat: (profile?.fat_goal_g ?? null) as number | null,
  };
  const hasMacroGoals = Object.values(macroGoals).some((g) => g !== null);
  const weekEntries = (rows ?? []) as FoodEntry[];
  const weekSummary: WeekDay[] = week.map((dateKey) => {
    const dayEntries = weekEntries.filter((e) => e.entry_date === dateKey);
    return {
      dateKey,
      calories: sumEntries(dayEntries).calories,
      hasEntries: dayEntries.length > 0,
    };
  });
  const entries = weekEntries.filter((e) => e.entry_date === date);
  const totals = sumEntries(entries);
  const status = getGoalStatus(totals.calories, goal);
  const progress = goal ? Math.min(100, (totals.calories / goal) * 100) : 0;

  return (
    <div className="space-y-6">
      <StreakBadge
        doneDates={foodDates}
        restWeekdays={[]}
        label="Food logging streak"
        startHint="Log a meal or snack today to start one."
      />
      <WeekStrip days={weekSummary} selected={date} goal={goal} />
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

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
          <MacroStat label="Protein" grams={totals.protein_g} goal={macroGoals.protein} />
          <MacroStat label="Carbs" grams={totals.carbs_g} goal={macroGoals.carbs} />
          <MacroStat label="Fat" grams={totals.fat_g} goal={macroGoals.fat} />
        </dl>
        {!hasMacroGoals && (
          <p className="mt-3 text-center text-xs text-muted">
            <Link href="/settings" className="font-medium text-accent underline">
              Set macro goals
            </Link>{" "}
            to see progress for each.
          </p>
        )}
      </section>

      <Link
        href={`/food/add?date=${date}`}
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

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PLAN } from "./defaults";

// Copies your starting weekly plan into your account. Safe to run twice: days
// that already exist are skipped, and exercises are only added to days created
// by THIS call, so a second run (or two requests at once) never duplicates anything.
export async function ensureDefaultPlan(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: created, error } = await supabase
    .from("workout_days")
    .upsert(
      DEFAULT_PLAN.map((d) => ({ user_id: userId, weekday: d.weekday, kind: d.kind, title: d.title })),
      { onConflict: "user_id,weekday", ignoreDuplicates: true },
    )
    .select("id, weekday");

  if (error || !created || created.length === 0) return;

  const exercises = created.flatMap((day) => {
    const plan = DEFAULT_PLAN.find((d) => d.weekday === day.weekday);
    return (plan?.exercises ?? []).map((exercise, index) => ({
      user_id: userId,
      day_id: day.id,
      position: index,
      name: exercise.name,
      superset_with_next: Boolean(exercise.supersetWithNext),
    }));
  });
  if (exercises.length > 0) await supabase.from("workout_exercises").insert(exercises);
}

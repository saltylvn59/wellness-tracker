import { createClient } from "@/lib/supabase/server";
import AiStatus from "@/components/AiStatus";
import GoalsForm from "@/components/GoalsForm";
import type { Goals } from "@/lib/goals";
import { signOut } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "calorie_goal, protein_goal_g, carb_goal_g, fat_goal_g, weekly_run_miles, weekly_cycle_miles, weekly_swim_yards",
    )
    .eq("id", userId ?? "")
    .maybeSingle();

  // Before you've saved anything, the calorie goal is blank (null).
  const goals = (profile ?? {
    calorie_goal: null,
    protein_goal_g: null,
    carb_goal_g: null,
    fat_goal_g: null,
    weekly_run_miles: null,
    weekly_cycle_miles: null,
    weekly_swim_yards: null,
  }) as unknown as Goals;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-2xl bg-card p-4">
        <GoalsForm goals={goals} />
      </section>

      <AiStatus keyPresent={Boolean(process.env.GEMINI_API_KEY)} />

      <form action={signOut}>
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl border border-border text-base font-medium active:opacity-80"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

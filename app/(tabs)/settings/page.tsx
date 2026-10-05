import { createClient } from "@/lib/supabase/server";
import CalorieGoalForm from "@/components/CalorieGoalForm";
import { signOut } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("calorie_goal")
    .eq("id", userId ?? "")
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-2xl bg-card p-4">
        <CalorieGoalForm currentGoal={profile?.calorie_goal ?? null} />
      </section>

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

import Link from "next/link";
import DateBadge from "@/components/DateBadge";
import { createClient } from "@/lib/supabase/server";

export default async function FoodPage() {
  // Read your calorie goal from the database (only your own row is visible to you).
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("calorie_goal")
    .eq("id", claims?.claims.sub ?? "")
    .maybeSingle();
  const goal = profile?.calorie_goal ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <DateBadge />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl active:bg-card"
        >
          ⚙️
        </Link>
      </div>

      <section className="rounded-2xl bg-card p-4">
        <h2 className="text-sm font-medium text-muted">Calories</h2>
        <p className="mt-1 text-3xl font-bold">
          0 <span className="text-base font-medium text-muted">kcal eaten</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {goal ? (
            <>Daily goal: {goal.toLocaleString("en-US")} kcal</>
          ) : (
            <>
              Daily goal not set yet.{" "}
              <Link href="/settings" className="font-medium text-accent underline">
                Set it in Settings
              </Link>
            </>
          )}
        </p>
      </section>

      <section className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Your meals will show up here. Photo and text logging are coming soon.
      </section>
    </div>
  );
}

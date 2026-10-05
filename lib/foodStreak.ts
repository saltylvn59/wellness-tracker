import type { SupabaseClient } from "@supabase/supabase-js";

// Every date (on or after `sinceKey`) on which you logged at least one food entry,
// for the Nutrition streak. We read the most recent 1000 entries (about 8 months at
// 4 entries a day) and keep the distinct dates, which is plenty for a streak.
export async function loadFoodLogDates(supabase: SupabaseClient, sinceKey: string): Promise<string[]> {
  const { data } = await supabase
    .from("food_entries")
    .select("entry_date")
    .gte("entry_date", sinceKey)
    .order("entry_date", { ascending: false })
    .limit(1000);
  return [...new Set((data ?? []).map((row) => row.entry_date as string))];
}

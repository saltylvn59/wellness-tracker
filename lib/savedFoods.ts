import type { SupabaseClient } from "@supabase/supabase-js";
import type { Nutrition } from "./food";

// In a database "ilike" search, % and _ are wildcards. Escape them so a name
// like "100% juice" matches only itself.
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Add a food to the saved library, or update it if one with the same name
// (ignoring upper/lower case) is already there. Returns true on success.
export async function upsertSavedFood(
  supabase: SupabaseClient,
  userId: string,
  nutrition: Nutrition,
): Promise<boolean> {
  const { data: updated, error: updateError } = await supabase
    .from("saved_foods")
    .update(nutrition)
    .eq("user_id", userId)
    .ilike("name", escapeLike(nutrition.name))
    .select("id");
  if (updateError) return false;
  if (updated && updated.length > 0) return true;

  const { error: insertError } = await supabase
    .from("saved_foods")
    .insert({ ...nutrition, user_id: userId });
  return !insertError;
}

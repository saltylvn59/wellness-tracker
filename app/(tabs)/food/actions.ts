"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidDateKey } from "@/lib/dates";
import { parseFoodForm, parseSource } from "@/lib/food";
import { upsertSavedFood } from "@/lib/savedFoods";

export type FormState = { message: string } | null;

// Add a new entry, or update one if the form includes its id.
export async function saveFoodEntry(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseFoodForm(formData);
  if (!parsed.ok) return { message: parsed.message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  const id = formData.get("id");
  const { error } =
    typeof id === "string" && id !== ""
      ? await supabase.from("food_entries").update(parsed.values).eq("id", id)
      : await supabase
          .from("food_entries")
          .insert({ ...parsed.values, user_id: userId, source: parseSource(formData.get("source")) });

  if (error) return { message: "Couldn't save. Please try again." };

  // "Save to my foods" toggle: also keep this food in your Saved foods library.
  // If a saved food with the same name exists, it's updated instead of duplicated.
  // (A problem here never blocks the entry above from being saved.)
  if (formData.get("save_food") === "on") {
    const { name, calories, protein_g, carbs_g, fat_g } = parsed.values;
    await upsertSavedFood(supabase, userId, { name, calories, protein_g, carbs_g, fat_g });
    revalidatePath("/food/saved");
  }

  revalidatePath("/food");
  // redirect() must run outside try/catch, so it sits last.
  redirect(`/food?date=${parsed.values.entry_date}`);
}

export async function deleteFoodEntry(formData: FormData) {
  const id = formData.get("id");
  const date = String(formData.get("entry_date") ?? "");

  if (typeof id === "string" && id !== "") {
    const supabase = await createClient();
    // Row Level Security means this can only ever delete your own entry.
    await supabase.from("food_entries").delete().eq("id", id);
  }

  revalidatePath("/food");
  redirect(isValidDateKey(date) ? `/food?date=${date}` : "/food");
}

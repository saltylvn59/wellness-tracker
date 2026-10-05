"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// "use server" = these functions run on the server when a form is submitted.
// Never trust what the browser sends: we check everything again here.

export type SaveResult = { ok: boolean; message: string } | null;

export async function saveCalorieGoal(
  _previous: SaveResult,
  formData: FormData,
): Promise<SaveResult> {
  const goal = Number(formData.get("calorie_goal"));
  if (!Number.isInteger(goal) || goal < 500 || goal > 10000) {
    return { ok: false, message: "Enter a whole number between 500 and 10,000." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  // Row Level Security in the database also enforces "only your own row".
  const { error } = await supabase
    .from("profiles")
    .update({ calorie_goal: goal })
    .eq("id", userId);

  if (error) return { ok: false, message: "Couldn't save. Please try again." };

  revalidatePath("/food");
  return { ok: true, message: "Saved." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

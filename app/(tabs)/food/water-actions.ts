"use server";

import { revalidatePath } from "next/cache";
import { currentUserId, failedSave, INVALID_DATE, SAVE_FAILED, SIGN_IN_AGAIN, type ActionResult } from "@/lib/actionResult";
import { isValidDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { BOTTLE_OZ, canAddWater } from "@/lib/water";

// One tap = one 20 oz bottle of water for that day.
export async function addWater(input: { date: string }): Promise<ActionResult> {
  if (!isValidDateKey(input.date)) return INVALID_DATE;

  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return SIGN_IN_AGAIN;

  // A sanity cap: add up today's water and refuse if one more bottle would pass it.
  const { data: rows, error: readError } = await supabase
    .from("water_logs")
    .select("ounces")
    .eq("log_date", input.date);
  if (readError) return failedSave(readError);
  const total = (rows ?? []).reduce((sum, row) => sum + Number(row.ounces), 0);
  if (!canAddWater(total)) return { ok: false, message: "That's a lot of water for one day." };

  const { error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, log_date: input.date, ounces: BOTTLE_OZ });
  if (error) return failedSave(error);

  revalidatePath("/food");
  return { ok: true };
}

// Removes the most recent bottle logged for that day (for an accidental tap).
export async function undoWater(input: { date: string }): Promise<ActionResult> {
  if (!isValidDateKey(input.date)) return INVALID_DATE;

  const supabase = await createClient();
  // Row Level Security means this only ever sees and deletes your own rows.
  const { data: latest } = await supabase
    .from("water_logs")
    .select("id")
    .eq("log_date", input.date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return { ok: true }; // nothing to undo

  const { error } = await supabase.from("water_logs").delete().eq("id", latest.id);
  if (error) return SAVE_FAILED;

  revalidatePath("/food");
  return { ok: true };
}

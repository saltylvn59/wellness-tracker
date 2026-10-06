"use server";

import { revalidatePath } from "next/cache";
import { currentUserId, failedSave, INVALID_DATE, SAVE_FAILED, SIGN_IN_AGAIN, type ActionResult } from "@/lib/actionResult";
import { isoWeekday, isValidDateKey } from "@/lib/dates";
import { isTanningDay, parseTanningMinutes } from "@/lib/tanning";
import { createClient } from "@/lib/supabase/server";

// Saves the tanning time for a day. Logging again on the same day replaces the minutes.
export async function saveTanning(input: { date: string; minutes: number }): Promise<ActionResult> {
  // Never trust the browser: check everything it sent.
  if (!isValidDateKey(input.date)) return INVALID_DATE;
  if (!isTanningDay(isoWeekday(input.date))) {
    return { ok: false, message: "Tanning is logged on Tuesdays and Thursdays." };
  }
  const minutes = parseTanningMinutes(input.minutes);
  if (minutes === null) return { ok: false, message: "Pick 5 to 15 minutes." };

  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return SIGN_IN_AGAIN;

  const { error } = await supabase
    .from("tanning_logs")
    .upsert({ user_id: userId, log_date: input.date, minutes }, { onConflict: "user_id,log_date" });
  if (error) return failedSave(error);

  revalidatePath("/workouts");
  return { ok: true };
}

export async function deleteTanning(date: string): Promise<ActionResult> {
  if (!isValidDateKey(date)) return INVALID_DATE;

  const supabase = await createClient();
  // Row Level Security means this can only ever delete your own log.
  const { error } = await supabase.from("tanning_logs").delete().eq("log_date", date);
  if (error) return SAVE_FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

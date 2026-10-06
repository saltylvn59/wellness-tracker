"use server";

import { revalidatePath } from "next/cache";
import { isoWeekday, isValidDateKey } from "@/lib/dates";
import { DATABASE_BEHIND_MESSAGE, isMissingSchemaError } from "@/lib/dbErrors";
import { isTanningDay, parseTanningMinutes } from "@/lib/tanning";
import { createClient } from "@/lib/supabase/server";

export type TanningResult = { ok: true } | { ok: false; message: string };

const FAILED: TanningResult = { ok: false, message: "Couldn't save. Please try again." };

// Saves the tanning time for a day. Logging again on the same day replaces the minutes.
export async function saveTanning(input: { date: string; minutes: number }): Promise<TanningResult> {
  // Never trust the browser: check everything it sent.
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }
  if (!isTanningDay(isoWeekday(input.date))) {
    return { ok: false, message: "Tanning is logged on Tuesdays and Thursdays." };
  }
  const minutes = parseTanningMinutes(input.minutes);
  if (minutes === null) return { ok: false, message: "Pick 5 to 15 minutes." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase
    .from("tanning_logs")
    .upsert({ user_id: userId, log_date: input.date, minutes }, { onConflict: "user_id,log_date" });
  if (error) return isMissingSchemaError(error) ? { ok: false, message: DATABASE_BEHIND_MESSAGE } : FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

export async function deleteTanning(date: string): Promise<TanningResult> {
  if (typeof date !== "string" || !isValidDateKey(date)) return { ok: false, message: "Invalid date." };

  const supabase = await createClient();
  // Row Level Security means this can only ever delete your own log.
  const { error } = await supabase.from("tanning_logs").delete().eq("log_date", date);
  if (error) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { isValidDateKey } from "@/lib/dates";
import { DATABASE_BEHIND_MESSAGE, isMissingSchemaError } from "@/lib/dbErrors";
import { parseWeight } from "@/lib/weight";
import { createClient } from "@/lib/supabase/server";

export type WeightResult = { ok: true } | { ok: false; message: string };

const FAILED: WeightResult = { ok: false, message: "Couldn't save. Please try again." };

// Saves your weigh-in for a day. Weighing in again on the same day replaces the number.
export async function saveWeight(input: { date: string; weight: number }): Promise<WeightResult> {
  // Never trust the browser: check everything it sent.
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }
  const weight = parseWeight(input.weight);
  if (weight === null) return { ok: false, message: "Pick a weight from 70 to 500 lb." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase
    .from("weight_logs")
    .upsert({ user_id: userId, log_date: input.date, weight_lb: weight }, { onConflict: "user_id,log_date" });
  if (error) return isMissingSchemaError(error) ? { ok: false, message: DATABASE_BEHIND_MESSAGE } : FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

export async function deleteWeight(date: string): Promise<WeightResult> {
  if (typeof date !== "string" || !isValidDateKey(date)) return { ok: false, message: "Invalid date." };

  const supabase = await createClient();
  // Row Level Security means this can only ever delete your own weigh-in.
  const { error } = await supabase.from("weight_logs").delete().eq("log_date", date);
  if (error) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

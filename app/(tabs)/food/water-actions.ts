"use server";

import { revalidatePath } from "next/cache";
import { DATABASE_BEHIND_MESSAGE, isMissingSchemaError } from "@/lib/dbErrors";
import { isValidDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { BOTTLE_OZ, canAddWater } from "@/lib/water";

export type WaterResult = { ok: true } | { ok: false; message: string };

const FAILED: WaterResult = { ok: false, message: "Couldn't save. Please try again." };

// One tap = one 20 oz bottle of water for that day.
export async function addWater(input: { date: string }): Promise<WaterResult> {
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, message: "Please sign in again." };

  // A sanity cap: add up today's water and refuse if one more bottle would pass it.
  const { data: rows, error: readError } = await supabase
    .from("water_logs")
    .select("ounces")
    .eq("log_date", input.date);
  if (readError) {
    return isMissingSchemaError(readError) ? { ok: false, message: DATABASE_BEHIND_MESSAGE } : FAILED;
  }
  const total = (rows ?? []).reduce((sum, row) => sum + Number(row.ounces), 0);
  if (!canAddWater(total)) return { ok: false, message: "That's a lot of water for one day." };

  const { error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, log_date: input.date, ounces: BOTTLE_OZ });
  if (error) return isMissingSchemaError(error) ? { ok: false, message: DATABASE_BEHIND_MESSAGE } : FAILED;

  revalidatePath("/food");
  return { ok: true };
}

// Removes the most recent bottle logged for that day (for an accidental tap).
export async function undoWater(input: { date: string }): Promise<WaterResult> {
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }

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
  if (error) return FAILED;

  revalidatePath("/food");
  return { ok: true };
}

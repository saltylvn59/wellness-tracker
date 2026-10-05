"use server";

import { revalidatePath } from "next/cache";
import { validateCardio } from "@/lib/cardio";
import { DATABASE_BEHIND_MESSAGE, isMissingSchemaError } from "@/lib/dbErrors";
import { isValidDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export type CardioResult = { ok: true } | { ok: false; message: string };

const FAILED: CardioResult = { ok: false, message: "Couldn't save. Please try again." };

// Saves one run, ride, or swim. Distance and time are both optional.
export async function logCardio(input: {
  date: string;
  kind: string;
  distance: number | null;
  minutes: number | null;
}): Promise<CardioResult> {
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }
  const checked = validateCardio(input.kind, input.distance, input.minutes);
  if (!checked.ok) return checked;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase.from("cardio_logs").insert({
    user_id: userId,
    log_date: input.date,
    kind: checked.kind,
    distance: checked.distance,
    distance_unit: checked.unit,
    duration_minutes: checked.minutes,
  });
  if (error) return isMissingSchemaError(error) ? { ok: false, message: DATABASE_BEHIND_MESSAGE } : FAILED;

  revalidatePath("/workouts"); // the cardio list, the streak, and the week rings all live here
  return { ok: true };
}

export async function deleteCardio(id: string): Promise<CardioResult> {
  if (typeof id !== "string" || id === "") return FAILED;

  const supabase = await createClient();
  // Row Level Security means this can only ever delete your own log.
  const { error } = await supabase.from("cardio_logs").delete().eq("id", id);
  if (error) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

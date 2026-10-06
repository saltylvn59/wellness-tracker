"use server";

import { revalidatePath } from "next/cache";
import { currentUserId, failedSave, INVALID_DATE, SAVE_FAILED, SIGN_IN_AGAIN, type ActionResult } from "@/lib/actionResult";
import { validateCardio } from "@/lib/cardio";
import { isValidDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

// Saves one run, ride, or swim. Distance and time are both optional.
export async function logCardio(input: {
  date: string;
  kind: string;
  distance: number | null;
  minutes: number | null;
}): Promise<ActionResult> {
  if (!isValidDateKey(input.date)) return INVALID_DATE;
  const checked = validateCardio(input.kind, input.distance, input.minutes);
  if (!checked.ok) return checked;

  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return SIGN_IN_AGAIN;

  const { error } = await supabase.from("cardio_logs").insert({
    user_id: userId,
    log_date: input.date,
    kind: checked.kind,
    distance: checked.distance,
    distance_unit: checked.unit,
    duration_minutes: checked.minutes,
  });
  if (error) return failedSave(error);

  revalidatePath("/workouts"); // the cardio list, the streak, and the week rings all live here
  return { ok: true };
}

export async function deleteCardio(id: string): Promise<ActionResult> {
  if (typeof id !== "string" || id === "") return SAVE_FAILED;

  const supabase = await createClient();
  // Row Level Security means this can only ever delete your own log.
  const { error } = await supabase.from("cardio_logs").delete().eq("id", id);
  if (error) return SAVE_FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { currentUserId, failedSave, INVALID_DATE, SIGN_IN_AGAIN, type ActionResult } from "@/lib/actionResult";
import { isoWeekday, isValidDateKey } from "@/lib/dates";
import { EXTRAS, parseExtraKind } from "@/lib/workouts/extras";
import { upsertSession } from "@/lib/workouts/session";
import { createClient } from "@/lib/supabase/server";

// Tick or untick the sauna or the stretch for a workout day.
export async function setExtraDone(input: {
  date: string;
  dayId: string;
  kind: string;
  done: boolean;
}): Promise<ActionResult> {
  // Never trust the browser: check everything it sent.
  const kind = parseExtraKind(input.kind);
  if (!kind) return { ok: false, message: "Invalid request." };
  if (typeof input.done !== "boolean") return { ok: false, message: "Invalid request." };
  if (!isValidDateKey(input.date)) return INVALID_DATE;

  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return SIGN_IN_AGAIN;

  // It must be one of YOUR lifting days, and the day's weekday must match the date
  // (Row Level Security means this only finds your own days).
  const { data: day } = await supabase
    .from("workout_days")
    .select("id, weekday, kind, title")
    .eq("id", String(input.dayId))
    .maybeSingle();
  if (!day || day.kind !== "lift" || day.weekday !== isoWeekday(input.date)) {
    return { ok: false, message: "That isn't a lifting day." };
  }

  // The first tick on a date also creates that day's workout session.
  const session = await upsertSession(
    supabase,
    userId,
    input.date,
    { id: day.id as string, title: day.title as string },
    { [EXTRAS[kind].column]: input.done },
  );
  if (!session.ok) return failedSave(session.error);

  revalidatePath("/workouts");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { isoWeekday, isValidDateKey } from "@/lib/dates";
import { DATABASE_BEHIND_MESSAGE } from "@/lib/dbErrors";
import { EXTRAS, parseExtraKind } from "@/lib/workouts/extras";
import { upsertSession } from "@/lib/workouts/session";
import { createClient } from "@/lib/supabase/server";

export type ExtrasResult = { ok: true } | { ok: false; message: string };

// Tick or untick the sauna or the stretch for a workout day.
export async function setExtraDone(input: {
  date: string;
  dayId: string;
  kind: string;
  done: boolean;
}): Promise<ExtrasResult> {
  // Never trust the browser: check everything it sent.
  const kind = parseExtraKind(input.kind);
  if (!kind) return { ok: false, message: "Invalid request." };
  if (typeof input.done !== "boolean") return { ok: false, message: "Invalid request." };
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, message: "Please sign in again." };

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
  if (!session.ok) {
    return {
      ok: false,
      message: session.databaseBehind ? DATABASE_BEHIND_MESSAGE : "Couldn't save. Please try again.",
    };
  }

  revalidatePath("/workouts");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { isoWeekday, isValidDateKey } from "@/lib/dates";
import { validateSaunaMinutes } from "@/lib/workouts/extras";
import { upsertSession } from "@/lib/workouts/session";
import { createClient } from "@/lib/supabase/server";

export type ExtrasResult = { ok: true } | { ok: false; message: string };

const FAILED: ExtrasResult = { ok: false, message: "Couldn't save. Please try again." };

// Shared checks: you're signed in, the date is real, and the day is one of YOUR
// lifting days that falls on that date's weekday (e.g. Monday's plan on a Monday).
async function loadLiftDay(dayId: unknown, date: unknown) {
  if (typeof date !== "string" || !isValidDateKey(date)) {
    return { ok: false as const, message: "Invalid date." };
  }
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false as const, message: "Please sign in again." };

  // Row Level Security means this only finds your own days.
  const { data: day } = await supabase
    .from("workout_days")
    .select("id, weekday, kind, title")
    .eq("id", String(dayId))
    .maybeSingle();
  if (!day || day.kind !== "lift" || day.weekday !== isoWeekday(date)) {
    return { ok: false as const, message: "That isn't a lifting day." };
  }
  return {
    ok: true as const,
    supabase,
    userId,
    date,
    day: { id: day.id as string, title: day.title as string },
  };
}

// Log (or change) the sauna time for a workout day.
export async function logSauna(input: {
  date: string;
  dayId: string;
  minutes: number;
}): Promise<ExtrasResult> {
  const checked = validateSaunaMinutes(input.minutes);
  if (!checked.ok) return checked;

  const loaded = await loadLiftDay(input.dayId, input.date);
  if (!loaded.ok) return loaded;

  const sessionId = await upsertSession(loaded.supabase, loaded.userId, loaded.date, loaded.day, {
    sauna_minutes: checked.minutes,
  });
  if (!sessionId) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

// Clear the sauna time (as if you hadn't logged it).
export async function removeSauna(input: { date: string }): Promise<ExtrasResult> {
  if (typeof input.date !== "string" || !isValidDateKey(input.date)) {
    return { ok: false, message: "Invalid date." };
  }
  const supabase = await createClient();
  // Row Level Security means this can only change your own session.
  const { error } = await supabase
    .from("workout_sessions")
    .update({ sauna_minutes: null })
    .eq("session_date", input.date);
  if (error) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

// Tick or untick the stretch session for a workout day.
export async function setStretchDone(input: {
  date: string;
  dayId: string;
  done: boolean;
}): Promise<ExtrasResult> {
  if (typeof input.done !== "boolean") return { ok: false, message: "Invalid request." };

  const loaded = await loadLiftDay(input.dayId, input.date);
  if (!loaded.ok) return loaded;

  const sessionId = await upsertSession(loaded.supabase, loaded.userId, loaded.date, loaded.day, {
    stretch_done: input.done,
  });
  if (!sessionId) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

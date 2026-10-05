"use server";

import { revalidatePath } from "next/cache";
import { isValidDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { validateSetInput } from "@/lib/workouts/logging";

export type LogResult = { ok: true } | { ok: false; message: string };

const FAILED: LogResult = { ok: false, message: "Couldn't save. Please try again." };

// Saves one set (weight and reps) for an exercise on a date.
// The first set you log on a date also creates that day's workout session.
export async function logSet(input: {
  date: string;
  exerciseId: string;
  weight: number;
  reps: number;
}): Promise<LogResult> {
  if (!isValidDateKey(String(input.date))) return { ok: false, message: "Invalid date." };
  const checked = validateSetInput(input.weight, input.reps);
  if (!checked.ok) return checked;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, message: "Please sign in again." };

  // Look the exercise up ourselves instead of trusting names sent by the browser.
  // Row Level Security means this only finds YOUR exercises.
  const { data: exercise } = await supabase
    .from("workout_exercises")
    .select("id, name, position, day_id")
    .eq("id", String(input.exerciseId))
    .maybeSingle();
  if (!exercise) return { ok: false, message: "Couldn't find that exercise." };

  const { data: day } = await supabase
    .from("workout_days")
    .select("id, title")
    .eq("id", exercise.day_id)
    .maybeSingle();
  if (!day) return FAILED;

  // One session per date (the table enforces it); reuse it if it already exists.
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .upsert(
      { user_id: userId, session_date: input.date, day_id: day.id, title: day.title },
      { onConflict: "user_id,session_date" },
    )
    .select("id")
    .single();
  if (sessionError || !session) return FAILED;

  // Next set number for this exercise today.
  const { data: last } = await supabase
    .from("workout_sets")
    .select("set_number")
    .eq("session_id", session.id)
    .eq("exercise_id", exercise.id)
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const setNumber = (last?.set_number ?? 0) + 1;
  if (setNumber > 50) return { ok: false, message: "That's the maximum of 50 sets for one exercise." };

  const { error } = await supabase.from("workout_sets").insert({
    user_id: userId,
    session_id: session.id,
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    position: exercise.position,
    set_number: setNumber,
    weight: checked.weight,
    reps: checked.reps,
  });
  if (error) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

export async function deleteSet(setId: string): Promise<LogResult> {
  if (typeof setId !== "string" || setId === "") return FAILED;

  const supabase = await createClient();
  // Row Level Security means this can only ever delete your own set.
  const { error } = await supabase.from("workout_sets").delete().eq("id", setId);
  if (error) return FAILED;

  revalidatePath("/workouts");
  return { ok: true };
}

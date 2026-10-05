import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSchemaError } from "@/lib/dbErrors";

// Extra things recorded on a workout day besides the sets themselves.
export type SessionFields = {
  sauna_done?: boolean;
  stretch_done?: boolean;
};

// Makes sure there is a workout session for this date (one per date, enforced by
// the database) and optionally updates its sauna / stretch ticks. Only the fields
// you pass are changed. On failure, `databaseBehind` is true when the cause is a
// missing column or table (a SQL step that hasn't been run yet).
export type UpsertSessionResult = { ok: true; id: string } | { ok: false; databaseBehind: boolean };

export async function upsertSession(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  day: { id: string; title: string },
  fields: SessionFields = {},
): Promise<UpsertSessionResult> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .upsert(
      { user_id: userId, session_date: date, day_id: day.id, title: day.title, ...fields },
      { onConflict: "user_id,session_date" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, databaseBehind: isMissingSchemaError(error) };
  return { ok: true, id: data.id as string };
}

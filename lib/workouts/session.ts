import type { SupabaseClient } from "@supabase/supabase-js";

// Extra things recorded on a workout day besides the sets themselves.
export type SessionFields = {
  sauna_minutes?: number | null;
  stretch_done?: boolean;
};

// Makes sure there is a workout session for this date (one per date, enforced by
// the database) and optionally updates its sauna / stretch fields. Only the fields
// you pass are changed. Returns the session id, or null if saving failed.
export async function upsertSession(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  day: { id: string; title: string },
  fields: SessionFields = {},
): Promise<string | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .upsert(
      { user_id: userId, session_date: date, day_id: day.id, title: day.title, ...fields },
      { onConflict: "user_id,session_date" },
    )
    .select("id")
    .single();
  return error || !data ? null : (data.id as string);
}

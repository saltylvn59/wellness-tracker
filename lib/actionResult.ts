import type { SupabaseClient } from "@supabase/supabase-js";
import { DATABASE_BEHIND_MESSAGE, isMissingSchemaError } from "./dbErrors";

// What every "save this" server action sends back to the screen. (This file is
// deliberately NOT a "use server" file: those may only export async functions.)
export type ActionResult = { ok: true } | { ok: false; message: string };

export const SAVE_FAILED: ActionResult = { ok: false, message: "Couldn't save. Please try again." };
export const INVALID_DATE: ActionResult = { ok: false, message: "Invalid date." };
export const SIGN_IN_AGAIN: ActionResult = { ok: false, message: "Please sign in again." };

/** The signed-in person's id, or null when the login has expired. */
export async function currentUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/** The reply for a failed database write: a missing SQL step gets its own clear message. */
export function failedSave(error: { code?: string | null } | null | undefined): ActionResult {
  return isMissingSchemaError(error) ? { ok: false, message: DATABASE_BEHIND_MESSAGE } : SAVE_FAILED;
}

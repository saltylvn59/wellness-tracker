import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// For code running in the browser (components marked "use client").
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}

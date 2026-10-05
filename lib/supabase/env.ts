// Reads the two Supabase settings from environment variables and fails with a
// clear message if one is missing (instead of a confusing error later).
//
// Both values are safe to expose to the browser: the "publishable" key only
// allows what our Row Level Security rules allow. The SECRET key must never
// be used in this app's browser code.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase settings. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (and in Vercel).",
    );
  }
  return { url, publishableKey };
}

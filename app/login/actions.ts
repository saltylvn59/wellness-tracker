"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Starts "Continue with Google" on the server. Supabase gives back Google's sign-in
// address (and saves a one-time check code in a cookie); we send you there. After you
// approve, Google sends you back to /auth/callback, which finishes the login.
// Doing this on the server means the login page doesn't download the Supabase library.
export async function signInWithGoogle() {
  // This app's own address (Next.js only runs server actions sent from this same site).
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=auth");
  redirect(data.url);
}

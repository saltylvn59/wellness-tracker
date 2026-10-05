"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    // Sends you to Google. After you approve, Google sends you back to our
    // /auth/callback page, which finishes the login.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
    >
      {loading ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

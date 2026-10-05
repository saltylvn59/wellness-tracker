import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends you back here with a one-time "code". We trade it for a
// real login session (stored in cookies), then send you to the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/food`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

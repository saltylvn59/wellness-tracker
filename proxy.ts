import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// In Next.js 16 this file is called "proxy" (older tutorials call it "middleware").
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on every page, but skip static files and the files the phone needs
  // *before* you're logged in (the home-screen manifest and icons).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

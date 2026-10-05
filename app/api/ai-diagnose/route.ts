import { NextResponse } from "next/server";
import { diagnoseGemini, type DiagnoseResult } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

// Shares the daily limit with food estimates (one check = one request), so the
// button can't be used to burn through the free AI quota.
const DAILY_LIMIT = 40;

type ApiResult = ({ ok: true } & DiagnoseResult) | { ok: false; message: string };
const reply = (body: ApiResult, status = 200) => NextResponse.json(body, { status });

// Signed-in users only. Returns whether the key exists on THIS deployment and what
// each Gemini model answered. Never returns the key itself.
export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return reply({ ok: false, message: "Please sign in again." }, 401);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return reply({ ok: false, message: `You've reached today's limit of ${DAILY_LIMIT} AI requests.` }, 429);
  }
  await supabase.from("ai_requests").insert({ user_id: userId });

  return reply({ ok: true, ...(await diagnoseGemini()) });
}

import { NextResponse } from "next/server";
import { estimateNutrition } from "@/lib/ai/gemini";
import type { AiEstimate } from "@/lib/ai/nutrition";
import { createClient } from "@/lib/supabase/server";

// The AI can take several seconds; allow up to 30.
export const maxDuration = 30;

// Each person can make this many AI requests per rolling 24 hours. The free AI
// quota is shared by everyone who can sign in, so one person can't use it all.
const DAILY_LIMIT = 40;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_IMAGE_BYTES = 4_000_000; // Vercel rejects request bodies over ~4.5 MB
const MAX_DESCRIPTION_CHARS = 500;

type ApiResult = { ok: true; estimate: AiEstimate } | { ok: false; message: string };
const reply = (body: ApiResult, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  // 1. Only signed-in users. (The login system supplies who is asking.)
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return reply({ ok: false, message: "Please sign in again." }, 401);

  // 2. Check what was sent. Never trust the browser.
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply({ ok: false, message: "That request wasn't valid." }, 400);
  }

  const description = String(form.get("description") ?? "").trim().slice(0, MAX_DESCRIPTION_CHARS);
  const file = form.get("image");
  let image: { mimeType: string; base64: string } | undefined;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return reply({ ok: false, message: "Please use a JPEG, PNG, WebP, or HEIC photo." }, 400);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return reply({ ok: false, message: "That photo is too large. Try a smaller one." }, 413);
    }
    image = {
      mimeType: file.type,
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
    };
  }

  if (!image && !description) {
    return reply({ ok: false, message: "Add a photo or a description first." }, 400);
  }

  // 3. Daily limit. Count first, then log this request (even if the AI then fails,
  //    so failed attempts can't be used to hammer the service).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return reply(
      { ok: false, message: `You've reached today's limit of ${DAILY_LIMIT} AI estimates. Enter foods manually, or try again tomorrow.` },
      429,
    );
  }
  await supabase.from("ai_requests").insert({ user_id: userId });

  // 4. Ask the AI, and pass along only the checked result.
  const result = await estimateNutrition({ description: description || undefined, image });
  if (result.ok) return reply({ ok: true, estimate: result.estimate });

  const status =
    result.reason === "rate_limited" ? 429 : result.reason === "not_configured" ? 503 : result.reason === "not_food" ? 422 : 502;
  return reply({ ok: false, message: result.message }, status);
}

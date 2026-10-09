import { ApiError, GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import { buildModelChain, classifyGeminiError, isTimeoutError } from "./modelChain";
import {
  NUTRITION_JSON_SCHEMA,
  parseAiNutrition,
  SYSTEM_PROMPT,
  type AiEstimate,
} from "./nutrition";
import {
  COACH_JSON_SCHEMA,
  COACH_SYSTEM_PROMPT,
  coachPrompt,
  parseCoachAdvice,
  type CoachAdvice,
  type CoachInput,
} from "./weightCoach";

// Time limits. The API route allows 30 seconds in total, so we stop trying new
// models once ~24 seconds have passed, and never wait more than 9 seconds on one.
const TOTAL_BUDGET_MS = 24_000;
const PER_MODEL_TIMEOUT_MS = 9_000;
const MIN_ATTEMPT_MS = 3_000;

export type EstimateInput = {
  description?: string;
  image?: { mimeType: string; base64: string };
};

export type EstimateResult =
  | { ok: true; estimate: AiEstimate }
  | {
      ok: false;
      reason: "not_configured" | "rate_limited" | "not_food" | "bad_response" | "failed";
      message: string;
    };

const BUSY: EstimateResult = {
  ok: false,
  reason: "rate_limited",
  message: "The AI is busy right now (free tier). Try again in a minute, or enter it manually.",
};

// This is the ONLY file that talks to Google. To switch AI providers later,
// replace the bodies of these functions and keep the same input and result shapes.
export async function estimateNutrition(input: EstimateInput): Promise<EstimateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "not_configured",
      message: "AI estimates aren't set up yet. You can enter the food manually.",
    };
  }

  const parts: Part[] = [];
  if (input.image) {
    parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.base64 } });
  }
  const description = input.description?.trim();
  parts.push({
    text: description
      ? `Description of the food from the user: ${description}`
      : "Estimate the nutrition for the food or drink in this photo.",
  });

  return runModelChain<EstimateResult>({
    apiKey,
    parts,
    systemInstruction: SYSTEM_PROMPT,
    schema: NUTRITION_JSON_SCHEMA,
    busy: BUSY,
    stopped: {
      ok: false,
      reason: "failed",
      message: "The AI couldn't estimate that. Please try again, or enter it manually.",
    },
    // A real answer (including "that isn't food") is final. An unreadable one
    // means this model had a bad moment, so give the next model a try.
    read: (text) => {
      const parsed = parseAiNutrition(text);
      return parsed.ok || parsed.reason === "not_food" ? { done: parsed } : { retry: parsed };
    },
  });
}

/**
 * Asks the AI for a healthy weekly pace toward your weight target, plus one line of
 * coaching. Returns null when the AI isn't set up, is busy, or sent something unusable;
 * the app then uses its built-in pace instead (lib/weightPlan.ts).
 */
export async function suggestWeightPace(input: CoachInput): Promise<CoachAdvice | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return runModelChain<CoachAdvice | null>({
    apiKey,
    parts: [{ text: coachPrompt(input) }],
    systemInstruction: COACH_SYSTEM_PROMPT,
    schema: COACH_JSON_SCHEMA,
    busy: null,
    stopped: null,
    read: (text) => {
      const advice = parseCoachAdvice(text, input.direction);
      return advice ? { done: advice } : { retry: null };
    },
  });
}

// Google's free-tier models are sometimes overloaded ("high demand", HTTP 503), slow,
// or retired. So we try a list of free models in order (see modelChain.ts) and use
// the first one that answers. You can put your own favorite first with GEMINI_MODEL.
async function runModelChain<T>(options: {
  apiKey: string;
  parts: Part[];
  systemInstruction: string;
  schema: object;
  busy: T; // the answer when every model was busy or we ran out of time
  stopped: T; // the answer when a problem means no model will work (like a bad key)
  read: (text: string | undefined) => { done: T } | { retry: T }; // check one model's reply
}): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastResult = options.busy;

  for (const model of buildModelChain(process.env.GEMINI_MODEL)) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break; // out of time: report what we have

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: options.parts }],
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: options.schema,
          temperature: 0.2,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // quick answers, fewer tokens
          abortSignal: AbortSignal.timeout(Math.min(PER_MODEL_TIMEOUT_MS, remaining)),
        },
      });

      const outcome = options.read(response.text);
      if ("done" in outcome) return outcome.done;
      lastResult = outcome.retry;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      const message = error instanceof Error ? error.message : "";
      const timedOut = isTimeoutError(error);

      // Log what happened for debugging (never the API key).
      console.error(
        `Gemini request failed on ${model}:`,
        timedOut ? "timed out" : status !== undefined ? `${status} ${message.slice(0, 160)}` : (error as Error)?.name ?? "unknown",
      );

      if (classifyGeminiError({ status, message, timedOut }) === "stop") return options.stopped;
      lastResult = options.busy;
    }
  }

  return lastResult;
}

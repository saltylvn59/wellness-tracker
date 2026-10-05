import { ApiError, GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import { buildModelChain, classifyGeminiError, isTimeoutError } from "./modelChain";
import { plainErrorMessage, redactSecrets } from "./redact";
import {
  NUTRITION_JSON_SCHEMA,
  parseAiNutrition,
  SYSTEM_PROMPT,
  type AiEstimate,
} from "./nutrition";

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
// replace the body of this function and keep the same input and result shapes.
//
// Google's free-tier models are sometimes overloaded ("high demand", HTTP 503), slow,
// or retired. So we try a list of free models in order (see modelChain.ts) and use
// the first one that answers. You can put your own favorite first with GEMINI_MODEL.
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

  const ai = new GoogleGenAI({ apiKey });
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastResult: EstimateResult = BUSY;

  for (const model of buildModelChain(process.env.GEMINI_MODEL)) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break; // out of time: report what we have

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: NUTRITION_JSON_SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // quick answers, fewer tokens
          abortSignal: AbortSignal.timeout(Math.min(PER_MODEL_TIMEOUT_MS, remaining)),
        },
      });

      const parsed = parseAiNutrition(response.text);
      // A real answer (including "that isn't food") is final. An unreadable one
      // means this model had a bad moment, so give the next model a try.
      if (parsed.ok || parsed.reason === "not_food") return parsed;
      lastResult = parsed;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      const message = error instanceof Error ? error.message : "";
      const timedOut = isTimeoutError(error);

      // Log what happened for debugging (never the API key).
      console.error(
        `Gemini request failed on ${model}:`,
        timedOut ? "timed out" : status !== undefined ? `${status} ${message.slice(0, 160)}` : (error as Error)?.name ?? "unknown",
      );

      if (classifyGeminiError({ status, message, timedOut }) === "stop") {
        return {
          ok: false,
          reason: "failed",
          message: "The AI couldn't estimate that. Please try again, or enter it manually.",
        };
      }
      lastResult = BUSY;
    }
  }

  return lastResult;
}

// ---------------------------------------------------------------------------
// Connection check, used by the "Test AI connection" button in Settings.
// Sends a tiny request to each model (stopping at the first that answers) and
// reports what happened, without ever including the API key.

export type DiagnoseAttempt = { model: string; ok: boolean; ms: number; detail: string };
export type DiagnoseResult = { keyPresent: boolean; attempts: DiagnoseAttempt[] };

export async function diagnoseGemini(): Promise<DiagnoseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { keyPresent: false, attempts: [] };

  const ai = new GoogleGenAI({ apiKey });
  const attempts: DiagnoseAttempt[] = [];

  for (const model of buildModelChain(process.env.GEMINI_MODEL)) {
    const started = Date.now();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }],
        config: {
          maxOutputTokens: 64,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: AbortSignal.timeout(8_000),
        },
      });
      attempts.push({
        model,
        ok: true,
        ms: Date.now() - started,
        detail: redactSecrets(response.text ?? "(empty reply)", 40),
      });
      break; // one working model is enough
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      const message = error instanceof Error ? error.message : "";
      const timedOut = isTimeoutError(error);
      attempts.push({
        model,
        ok: false,
        ms: Date.now() - started,
        detail: timedOut
          ? "timed out"
          : redactSecrets(`${status ?? ""} ${plainErrorMessage(message)}`.trim() || "unknown error"),
      });
      if (classifyGeminiError({ status, message, timedOut }) === "stop") break; // e.g. a bad key
    }
  }
  return { keyPresent: true, attempts };
}

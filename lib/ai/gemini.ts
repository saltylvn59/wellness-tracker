import { ApiError, GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import {
  NUTRITION_JSON_SCHEMA,
  parseAiNutrition,
  SYSTEM_PROMPT,
  type AiEstimate,
} from "./nutrition";

// Which Gemini model to use. Override with GEMINI_MODEL in .env.local / Vercel
// if Google renames or retires this one.
const DEFAULT_MODEL = "gemini-3.8-flash";

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

// This is the ONLY file that talks to Google. To switch AI providers later,
// replace the body of this function and keep the same input and result shapes.
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

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: NUTRITION_JSON_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // quick answers, fewer tokens
        abortSignal: AbortSignal.timeout(25_000),
      },
    });
    return parseAiNutrition(response.text);
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return {
        ok: false,
        reason: "rate_limited",
        message: "The AI is busy right now (free-tier limit). Try again in a minute, or enter it manually.",
      };
    }
    // Log what went wrong for debugging, never the API key.
    console.error(
      "Gemini request failed:",
      error instanceof ApiError ? `${error.status} ${error.message}` : error instanceof Error ? error.name : "unknown error",
    );
    return {
      ok: false,
      reason: "failed",
      message: "The AI couldn't estimate that. Please try again, or enter it manually.",
    };
  }
}

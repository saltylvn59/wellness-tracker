// Which Gemini models to try, in order, and what to do when one of them fails.
// All of these are on Google's free tier. Google sometimes overloads a model
// ("high demand", HTTP 503) or retires one, so the app falls back to the next.

// Best first. (gemini-3.7-flash and gemini-2.5-flash are left out: the first
// kept timing out and the second is no longer offered to new users.)
export const DEFAULT_MODEL_CHAIN = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
] as const;

/** Your chosen model (GEMINI_MODEL) goes first, then the defaults, with no repeats. */
export function buildModelChain(
  preferred?: string | null,
  defaults: readonly string[] = DEFAULT_MODEL_CHAIN,
): string[] {
  const chosen = preferred?.trim();
  return [...new Set([...(chosen ? [chosen] : []), ...defaults])];
}

export type ErrorAction = "try-next-model" | "stop";

/**
 * After a failed request: is it worth trying the next model, or will every model
 * fail the same way? Overload, timeouts, and retired models are model-specific.
 * A bad API key or no permission fails everywhere, so stop right away.
 */
export function classifyGeminiError(error: {
  status?: number;
  message?: string;
  timedOut?: boolean;
}): ErrorAction {
  if (error.timedOut) return "try-next-model";

  const { status, message = "" } = error;
  // Google reports an invalid key as HTTP 400 with "API key" in the message.
  if (status === 401 || status === 403 || /api key/i.test(message)) return "stop";

  // 429 busy/quota, 5xx overload or outage, 404 model retired, 400 model-specific problem
  return "try-next-model";
}

/** True for the errors a request abort or timeout produces. */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

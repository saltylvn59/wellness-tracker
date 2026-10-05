import { describe, expect, it } from "vitest";
import {
  buildModelChain,
  classifyGeminiError,
  DEFAULT_MODEL_CHAIN,
  isTimeoutError,
} from "./modelChain";

describe("buildModelChain", () => {
  it("uses the defaults when no model is chosen", () => {
    expect(buildModelChain()).toEqual([...DEFAULT_MODEL_CHAIN]);
    expect(buildModelChain("")).toEqual([...DEFAULT_MODEL_CHAIN]);
    expect(buildModelChain("   ")).toEqual([...DEFAULT_MODEL_CHAIN]);
    expect(buildModelChain(null)).toEqual([...DEFAULT_MODEL_CHAIN]);
  });

  it("puts the chosen model first", () => {
    const chain = buildModelChain("gemini-9-pro");
    expect(chain[0]).toBe("gemini-9-pro");
    expect(chain.slice(1)).toEqual([...DEFAULT_MODEL_CHAIN]);
  });

  it("doesn't repeat a model that's already in the list", () => {
    const chain = buildModelChain("gemini-3.5-flash-lite");
    expect(chain[0]).toBe("gemini-3.5-flash-lite");
    expect(chain.filter((m) => m === "gemini-3.5-flash-lite")).toHaveLength(1);
    expect(chain).toHaveLength(DEFAULT_MODEL_CHAIN.length);
  });

  it("has several free models to fall back on", () => {
    expect(DEFAULT_MODEL_CHAIN.length).toBeGreaterThanOrEqual(3);
    expect(new Set(DEFAULT_MODEL_CHAIN).size).toBe(DEFAULT_MODEL_CHAIN.length);
  });
});

describe("classifyGeminiError", () => {
  it("tries the next model when Google is overloaded or busy", () => {
    for (const status of [429, 500, 502, 503, 504]) {
      expect(classifyGeminiError({ status, message: "high demand" })).toBe("try-next-model");
    }
  });

  it("tries the next model after a timeout", () => {
    expect(classifyGeminiError({ timedOut: true })).toBe("try-next-model");
  });

  it("tries the next model when a model has been retired", () => {
    expect(classifyGeminiError({ status: 404, message: "no longer available to new users" })).toBe(
      "try-next-model",
    );
  });

  it("stops on a bad key or missing permission, since every model would fail", () => {
    expect(classifyGeminiError({ status: 401 })).toBe("stop");
    expect(classifyGeminiError({ status: 403, message: "permission denied" })).toBe("stop");
    expect(classifyGeminiError({ status: 400, message: "API key not valid. Please pass a valid API key." })).toBe(
      "stop",
    );
  });

  it("treats a generic 400 as a model-specific problem", () => {
    expect(classifyGeminiError({ status: 400, message: "thinking level not supported" })).toBe(
      "try-next-model",
    );
  });

  it("tries the next model when the error has no details", () => {
    expect(classifyGeminiError({})).toBe("try-next-model");
  });
});

describe("isTimeoutError", () => {
  it("recognizes abort and timeout errors only", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    expect(isTimeoutError(abort)).toBe(true);
    expect(isTimeoutError(timeout)).toBe(true);
    expect(isTimeoutError(new Error("boom"))).toBe(false);
    expect(isTimeoutError("AbortError")).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { plainErrorMessage, redactSecrets } from "./redact";

describe("redactSecrets", () => {
  it("leaves ordinary messages alone", () => {
    expect(redactSecrets("This model is currently experiencing high demand.")).toBe(
      "This model is currently experiencing high demand.",
    );
  });

  it("hides Google-style API keys", () => {
    const text = "bad key AIzaSyA1234567890abcdefghijklmnopqrstu was rejected";
    expect(redactSecrets(text)).toBe("bad key [hidden] was rejected");
    expect(redactSecrets("token AQ.Ab8RN6Kg4L7-u8o-GUOHtJu2sB0h4vNVOJY3YrRa here")).toBe("token [hidden] here");
  });

  it("hides keys inside URLs but keeps the rest", () => {
    expect(redactSecrets("GET https://x.test/v1?key=SECRETVALUE123&alt=json failed")).toBe(
      "GET https://x.test/v1?key=[hidden]&alt=json failed",
    );
  });

  it("collapses whitespace and shortens long messages", () => {
    expect(redactSecrets("line one\n\n   line two")).toBe("line one line two");
    const long = redactSecrets("x".repeat(500), 50);
    expect(long).toHaveLength(50);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("plainErrorMessage", () => {
  it("pulls the readable message out of Google's JSON errors", () => {
    const raw = '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}';
    expect(plainErrorMessage(raw)).toBe("This model is currently experiencing high demand.");
  });

  it("returns other text unchanged", () => {
    expect(plainErrorMessage("fetch failed")).toBe("fetch failed");
    expect(plainErrorMessage('{"unexpected":"shape"}')).toBe('{"unexpected":"shape"}');
    expect(plainErrorMessage('{"error":{"message":""}}')).toBe('{"error":{"message":""}}');
    expect(plainErrorMessage("")).toBe("");
  });
});

// Diagnostic messages come from Google, and error text could (in theory) echo part
// of a credential. Before showing any of it, hide anything that looks like a key.

const KEY_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_-]{20,}/g, // classic Google API keys
  /AQ\.[0-9A-Za-z_-]{20,}/g, // newer Google AI Studio keys
  /sk-[0-9A-Za-z_-]{20,}/g, // keys from other providers
  /(key=)[^&\s"']+/gi, // key=... inside a URL
];

/** Replaces key-like text with [hidden] and keeps the message short. */
export function redactSecrets(text: string, maxLength = 160): string {
  let cleaned = text.replace(/\s+/g, " ").trim();
  for (const pattern of KEY_PATTERNS) {
    cleaned = cleaned.replace(pattern, (match, prefix) =>
      typeof prefix === "string" && /key=/i.test(prefix) ? `${prefix}[hidden]` : "[hidden]",
    );
  }
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

/**
 * Google often wraps errors as JSON: {"error":{"message":"..."}}. This returns just
 * the readable message when it can, and the original text otherwise.
 */
export function plainErrorMessage(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    const message = (parsed as { error?: { message?: unknown } })?.error?.message;
    if (typeof message === "string" && message.trim() !== "") return message;
  } catch {
    // not JSON: fall through
  }
  return raw;
}

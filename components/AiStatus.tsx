"use client";

import { useState } from "react";

type Attempt = { model: string; ok: boolean; ms: number; detail: string };
type Report = { keyPresent: boolean; attempts: Attempt[] };

// Settings card that shows whether the AI is connected on THIS deployment, and lets
// you run a quick test. It never shows the API key.
export default function AiStatus({ keyPresent }: { keyPresent: boolean }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function runTest() {
    setTesting(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch("/api/ai-diagnose", { method: "POST" });
      const data = (await response.json().catch(() => null)) as
        | ({ ok: true } & Report)
        | { ok: false; message: string }
        | null;
      if (data?.ok) setReport({ keyPresent: data.keyPresent, attempts: data.attempts });
      else setError(data?.message ?? "The test couldn't run. Please try again.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setTesting(false);
    }
  }

  const working = report?.attempts.find((a) => a.ok);
  const missing = !keyPresent || report?.keyPresent === false;

  return (
    <section className="space-y-3 rounded-2xl bg-card p-4">
      <h2 className="text-sm font-semibold">AI food estimates</h2>

      <p className="text-sm">
        Gemini API key on this site:{" "}
        {missing ? (
          <span className="font-semibold text-danger">❌ missing</span>
        ) : (
          <span className="font-semibold text-accent">✅ found</span>
        )}
      </p>

      {missing && (
        <p className="text-sm text-muted">
          Add <code className="rounded bg-border px-1">GEMINI_API_KEY</code> in Vercel under Settings →
          Environment Variables (tick Production), then redeploy.
        </p>
      )}

      <button
        type="button"
        onClick={runTest}
        disabled={testing}
        className="min-h-12 w-full rounded-xl border border-border text-base font-medium active:opacity-80 disabled:opacity-60"
      >
        {testing ? "Testing… (up to 30 seconds)" : "Test AI connection"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {report && !missing && (
        <div role="status" className="space-y-1.5 text-sm">
          <p className={`font-semibold ${working ? "text-accent" : "text-danger"}`}>
            {working
              ? `✅ Working: ${working.model} answered in ${(working.ms / 1000).toFixed(1)} s`
              : "❌ No model answered right now"}
          </p>
          <ul className="space-y-1 text-muted">
            {report.attempts.map((attempt) => (
              <li key={attempt.model}>
                {attempt.ok ? "✅" : "❌"} <span className="font-medium text-foreground">{attempt.model}</span>
                {" · "}
                {attempt.ok ? `${(attempt.ms / 1000).toFixed(1)} s` : attempt.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

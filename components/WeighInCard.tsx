"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import WheelPicker from "@/components/WheelPicker";
import { deleteWeight, saveWeight } from "@/app/(tabs)/weight/actions";
import { formatDayNumber, formatShortMonth } from "@/lib/dates";
import {
  DEFAULT_WEIGHT_LB,
  formatWeightLb,
  joinWeight,
  splitWeight,
  TENTH_OPTIONS,
  WHOLE_POUND_OPTIONS,
} from "@/lib/weight";
import type { WeighIn } from "@/lib/weightPlan";

// The top of the Weight tab: two scroll wheels (pounds and tenths) right on the page.
// Swipe them up or down to your weight, then tap Save. Saving again the same day
// just changes the number.
export default function WeighInCard({
  date,
  latest,
  fallback,
}: {
  date: string;
  latest: WeighIn | null; // your latest weigh-in on or before this date
  fallback: number | null; // where the wheels start before your first weigh-in (your start or target)
}) {
  const router = useRouter();
  const saved = latest?.date === date ? latest.pounds : null; // this day's weigh-in, if any
  const start = splitWeight(latest?.pounds ?? fallback ?? DEFAULT_WEIGHT_LB);
  const [whole, setWhole] = useState(start.whole);
  const [tenth, setTenth] = useState(start.tenth);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const picked = joinWeight(whole, tenth);
  const unchanged = saved !== null && picked === saved;

  function run(action: () => ReturnType<typeof saveWeight>, done: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMessage({ ok: true, text: done });
        router.refresh();
      } else setMessage({ ok: false, text: result.message });
    });
  }

  return (
    <section aria-label="Weigh-in" className="space-y-3 rounded-2xl bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">
          <span aria-hidden="true">⚖️</span> Weigh-in
        </h2>
        <p className="text-xs text-muted">
          {saved !== null
            ? `Logged: ${formatWeightLb(saved)} lb`
            : latest
              ? `Last: ${formatWeightLb(latest.pounds)} lb on ${formatShortMonth(latest.date)} ${formatDayNumber(latest.date)}`
              : "No weigh-ins yet"}
        </p>
      </div>

      <div className="flex gap-3">
        <WheelPicker label="Pounds" options={WHOLE_POUND_OPTIONS} value={whole} onChange={setWhole} />
        <WheelPicker label="Tenths" options={TENTH_OPTIONS} value={tenth} onChange={setTenth} format={(n) => `.${n}`} />
      </div>

      <button
        type="button"
        onClick={() => run(() => saveWeight({ date, weight: picked }), "Saved.")}
        disabled={pending || unchanged}
        className="min-h-14 w-full rounded-xl bg-accent text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-50"
      >
        {pending ? "Saving…" : unchanged ? `✓ ${formatWeightLb(picked)} lb saved` : `Save ${formatWeightLb(picked)} lb`}
      </button>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-accent" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      {saved !== null && (
        <button
          type="button"
          onClick={() => run(() => deleteWeight(date), "Removed.")}
          disabled={pending}
          className="min-h-11 w-full rounded-xl text-sm font-medium text-danger active:opacity-70 disabled:opacity-60"
        >
          Remove this weigh-in
        </button>
      )}
    </section>
  );
}

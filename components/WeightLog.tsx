"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import WheelPicker from "@/components/WheelPicker";
import { deleteWeight, saveWeight } from "@/app/(tabs)/workouts/weight-actions";
import { formatDayNumber, formatFullDate, formatShortMonth } from "@/lib/dates";
import {
  DEFAULT_WEIGHT_LB,
  describeTargetGap,
  formatWeightLb,
  joinWeight,
  type LatestWeight,
  splitWeight,
  TENTH_OPTIONS,
  WHOLE_POUND_OPTIONS,
} from "@/lib/weight";

// A slim row on cardio days: your current weight (your latest weigh-in), a small line with how
// far you are from your target, and a button that opens two scroll wheels (pounds and tenths).
export default function WeightLog({
  date,
  latest,
  target,
}: {
  date: string;
  latest: LatestWeight | null;
  target: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const start = splitWeight(latest?.pounds ?? target ?? DEFAULT_WEIGHT_LB);
  const [whole, setWhole] = useState(start.whole);
  const [tenth, setTenth] = useState(start.tenth);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loggedToday = latest?.date === date;

  function openSheet() {
    const next = splitWeight(latest?.pounds ?? target ?? DEFAULT_WEIGHT_LB);
    setWhole(next.whole);
    setTenth(next.tenth);
    setError(null);
    setOpen(true);
  }

  function run(action: () => ReturnType<typeof saveWeight>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else setError(result.message);
    });
  }

  const gap = latest && target !== null ? describeTargetGap(latest.pounds, target) : null;
  // The small line under the number: when you last weighed in (if not today) and the target.
  const details = [
    latest && !loggedToday ? `as of ${formatShortMonth(latest.date)} ${formatDayNumber(latest.date)}` : null,
    target !== null && gap ? `${gap.atTarget ? "🎯 " : ""}${gap.text} (target ${formatWeightLb(target)})` : null,
    target !== null && !gap ? `Target ${formatWeightLb(target)} lb` : null,
  ].filter(Boolean);

  return (
    <section aria-label="Weight" className="rounded-2xl bg-card px-4 py-1.5">
      <div className="flex items-center gap-3">
        <span className="text-base" aria-hidden="true">
          ⚖️
        </span>
        <div className="min-w-0 flex-1">
          {latest ? (
            <p className="text-base font-semibold leading-tight tabular-nums">
              {formatWeightLb(latest.pounds)} <span className="text-xs font-medium text-muted">lb</span>
            </p>
          ) : (
            <p className="text-sm text-muted">No weigh-ins yet</p>
          )}
          {details.length > 0 && <p className="truncate text-xs text-muted">{details.join(" · ")}</p>}
        </div>
        <button
          type="button"
          onClick={openSheet}
          className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm font-semibold text-accent active:opacity-70"
        >
          {loggedToday ? "Update" : "Log"}
        </button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} label="Log weight">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">
              <span aria-hidden="true">⚖️</span> Weigh-in
            </h2>
            <p className="text-sm text-muted">{formatFullDate(date)}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 shrink-0 rounded-xl px-3 text-base font-semibold text-accent active:opacity-70"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-3">
          <WheelPicker label="Pounds" options={WHOLE_POUND_OPTIONS} value={whole} onChange={setWhole} />
          <WheelPicker
            label="Tenths"
            options={TENTH_OPTIONS}
            value={tenth}
            onChange={setTenth}
            format={(n) => `.${n}`}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => run(() => saveWeight({ date, weight: joinWeight(whole, tenth) }))}
          disabled={pending}
          className="min-h-14 w-full rounded-xl bg-accent text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
        >
          {pending ? "Saving…" : `Save ${formatWeightLb(joinWeight(whole, tenth))} lb`}
        </button>
        {loggedToday && (
          <button
            type="button"
            onClick={() => run(() => deleteWeight(date))}
            disabled={pending}
            className="min-h-11 w-full rounded-xl text-base font-medium text-danger active:opacity-70 disabled:opacity-60"
          >
            Remove today&apos;s weigh-in
          </button>
        )}
      </BottomSheet>
    </section>
  );
}

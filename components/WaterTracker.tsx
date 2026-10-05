"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addWater, undoWater } from "@/app/(tabs)/food/water-actions";
import { BOTTLE_OZ, DAILY_WATER_OZ, STEP_MILESTONES, waterProgress } from "@/lib/water";

// The Water card on the Nutrition tab: tap "+ 20 oz" each time you finish a bottle.
// Three steps (20, 40, 60 oz) fill in as you go; the third one is your daily goal.
export default function WaterTracker({ date, totalOz }: { date: string; totalOz: number }) {
  const router = useRouter();
  // The number updates instantly; if saving fails it goes back to what's really saved.
  const [total, changeTotal] = useOptimistic(totalOz, (current, delta: number) => Math.max(0, current + delta));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const progress = waterProgress(total);

  function change(delta: number, action: () => ReturnType<typeof addWater>) {
    setError(null);
    startTransition(async () => {
      changeTotal(delta);
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted">
          <span aria-hidden="true">💧</span> Water
        </h2>
        <p className="text-sm tabular-nums">
          <span className="text-2xl font-bold">{progress.total}</span>
          <span className="text-muted"> / {DAILY_WATER_OZ} oz</span>
        </p>
      </div>

      <ol aria-label="Water steps" className="mt-3 grid grid-cols-3 gap-2">
        {STEP_MILESTONES.map((oz, index) => {
          const done = progress.steps > index;
          return (
            <li
              key={oz}
              aria-label={`Step ${index + 1}, ${oz} ounces${done ? ", done" : ""}`}
              className={`rounded-xl py-2 text-center text-xs font-semibold ${
                done ? "bg-accent text-on-accent" : "bg-border text-muted"
              }`}
            >
              {done ? "✓ " : ""}Step {index + 1}
              <span className="block text-[11px] font-medium opacity-90">{oz} oz</span>
            </li>
          );
        })}
      </ol>

      <p className={`mt-2 text-sm ${progress.goalReached ? "font-semibold text-accent" : "text-muted"}`}>
        {progress.goalReached
          ? "🎉 Daily water goal reached!"
          : `Step ${progress.steps + 1} of 3 · ${BOTTLE_OZ - (progress.total % BOTTLE_OZ)} oz to go`}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => change(BOTTLE_OZ, () => addWater({ date }))}
          disabled={pending}
          className="min-h-12 flex-1 rounded-xl bg-accent text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
        >
          + {BOTTLE_OZ} oz
        </button>
        <button
          type="button"
          onClick={() => change(-BOTTLE_OZ, () => undoWater({ date }))}
          disabled={pending || progress.total === 0}
          aria-label="Undo the last 20 oz"
          className="min-h-12 rounded-xl border border-border px-5 text-base font-medium active:opacity-80 disabled:opacity-40"
        >
          Undo
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

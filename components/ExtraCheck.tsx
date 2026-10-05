"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setExtraDone } from "@/app/(tabs)/workouts/extras-actions";
import { EXTRAS, type ExtraKind } from "@/lib/workouts/extras";

// A 10 minute sauna or stretch on a lifting day: tap the checkbox on the right
// (where the Log button sits on an exercise) to mark it done.
export default function ExtraCheck({
  kind,
  date,
  dayId,
  done,
}: {
  kind: ExtraKind;
  date: string;
  dayId: string;
  done: boolean;
}) {
  const router = useRouter();
  const extra = EXTRAS[kind];
  // The box ticks instantly; if saving fails it goes back to what's really saved.
  const [checked, setChecked] = useOptimistic(done, (_current, next: boolean) => next);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      setChecked(next);
      const result = await setExtraDone({ date, dayId, kind, done: next });
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <div>
      <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-card px-4 py-3 active:opacity-80">
        <span className="min-w-0">
          <span className="block text-base font-medium">
            <span aria-hidden="true">{extra.icon}</span> {extra.label}
          </span>
          <span className={`block text-xs ${checked ? "font-medium text-accent" : "text-muted"}`}>
            {checked ? "✓ Done" : `${extra.minutes} minutes · ${extra.when}`}
          </span>
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => toggle(event.target.checked)}
          aria-label={`${extra.label}, ${extra.minutes} minutes`}
          className="h-8 w-8 shrink-0 accent-[var(--accent)]"
        />
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

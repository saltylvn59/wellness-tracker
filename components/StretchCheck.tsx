"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStretchDone } from "@/app/(tabs)/workouts/extras-actions";
import { STRETCH_MINUTES } from "@/lib/workouts/extras";

// The stretch session at the end of a lifting day: a fixed 10 minutes that you
// log with one tap on the checkbox.
export default function StretchCheck({
  date,
  dayId,
  done,
}: {
  date: string;
  dayId: string;
  done: boolean;
}) {
  const router = useRouter();
  // The box ticks instantly; if saving fails it goes back to what's really saved.
  const [checked, setChecked] = useOptimistic(done, (_current, next: boolean) => next);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      setChecked(next);
      const result = await setStretchDone({ date, dayId, done: next });
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <div>
      <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl bg-card px-4 py-3 active:opacity-80">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => toggle(event.target.checked)}
          className="h-7 w-7 shrink-0 accent-[var(--accent)]"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">
            <span aria-hidden="true">🧘</span> Stretch
          </span>
          <span className="block text-xs text-muted">{STRETCH_MINUTES} minutes · end of workout</span>
        </span>
        {checked && <span className="shrink-0 text-sm font-semibold text-accent">✓ Done</span>}
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

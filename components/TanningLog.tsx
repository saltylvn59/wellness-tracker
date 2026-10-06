"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import WheelPicker from "@/components/WheelPicker";
import { deleteTanning, saveTanning } from "@/app/(tabs)/workouts/tanning-actions";
import { DEFAULT_TANNING_MINUTES, TANNING_MINUTE_OPTIONS } from "@/lib/tanning";

// A quiet row for Tuesday and Thursday: just a sun. Tap it to pick 5 to 15 minutes on a
// scroll wheel. It's plain text with no card, so it doesn't pull attention from the cardio.
export default function TanningLog({ date, minutes }: { date: string; minutes: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(minutes ?? DEFAULT_TANNING_MINUTES);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openSheet() {
    setPicked(minutes ?? DEFAULT_TANNING_MINUTES);
    setError(null);
    setOpen(true);
  }

  function run(action: () => ReturnType<typeof saveTanning>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else setError(result.message);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={openSheet}
        aria-label={minutes === null ? "Log tanning time" : `Tanning, ${minutes} minutes. Tap to change`}
        className="flex min-h-11 w-full items-center gap-2 px-1 text-sm text-muted active:opacity-70"
      >
        <span aria-hidden="true">☀️</span>
        {minutes !== null && <span className="tabular-nums">{minutes} min</span>}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} label="Tanning time">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">
            <span aria-hidden="true">☀️</span> Tanning
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 shrink-0 rounded-xl px-3 text-base font-semibold text-accent active:opacity-70"
          >
            Cancel
          </button>
        </div>

        <div className="flex">
          <WheelPicker
            label="Minutes"
            options={TANNING_MINUTE_OPTIONS}
            value={picked}
            onChange={setPicked}
            format={(n) => `${n} min`}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => run(() => saveTanning({ date, minutes: picked }))}
          disabled={pending}
          className="min-h-14 w-full rounded-xl bg-accent text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {minutes !== null && (
          <button
            type="button"
            onClick={() => run(() => deleteTanning(date))}
            disabled={pending}
            className="min-h-11 w-full rounded-xl text-base font-medium text-danger active:opacity-70 disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </BottomSheet>
    </div>
  );
}

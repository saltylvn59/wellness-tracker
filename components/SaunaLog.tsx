"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import WheelPicker from "@/components/WheelPicker";
import { logSauna, removeSauna } from "@/app/(tabs)/workouts/extras-actions";
import {
  defaultSaunaMinutes,
  SAUNA_DEFAULT,
  SAUNA_MAX,
  SAUNA_MIN,
  SAUNA_OPTIONS,
} from "@/lib/workouts/extras";

// The sauna card at the start of a lifting day. "Log" opens a sheet where you
// swipe the wheel to pick 5 to 30 minutes (it starts at 10) and save it.
export default function SaunaLog({
  date,
  dayId,
  minutes,
}: {
  date: string;
  dayId: string;
  minutes: number | null; // minutes already logged for today, if any
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultSaunaMinutes(minutes));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await logSauna({ date, dayId, minutes: value });
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else setError(result.message);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeSauna({ date });
      if (result.ok) {
        setOpen(false);
        setValue(SAUNA_DEFAULT);
        router.refresh();
      } else setError(result.message);
    });
  }

  const logged = minutes !== null;

  return (
    <>
      <div className="rounded-2xl bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium">
              <span aria-hidden="true">🧖</span> Sauna
            </p>
            <p className="text-xs text-muted">Start of workout</p>
          </div>
          <p className="shrink-0 text-sm text-muted">
            {SAUNA_MIN}–{SAUNA_MAX} min
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={`min-w-0 text-xs ${logged ? "font-medium text-accent" : "text-muted"}`}>
            {logged ? `✓ Logged: ${minutes} min` : `Default ${SAUNA_DEFAULT} min`}
          </p>
          <button
            type="button"
            onClick={() => {
              setValue(defaultSaunaMinutes(minutes)); // reopen on today's value (or 10)
              setOpen(true);
            }}
            className="min-h-11 shrink-0 rounded-xl bg-accent px-6 text-base font-semibold text-on-accent active:opacity-80"
          >
            {logged ? "Edit" : "Log"}
          </button>
        </div>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} label="Log sauna time">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Sauna</h2>
            <p className="text-sm text-muted">Swipe to choose how many minutes.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 shrink-0 rounded-xl px-3 text-base font-semibold text-accent active:opacity-70"
          >
            Done
          </button>
        </div>

        <div className="mx-auto w-44">
          <WheelPicker label="Minutes" options={SAUNA_OPTIONS} value={value} onChange={setValue} />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="min-h-14 w-full rounded-xl bg-accent text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
        >
          {pending ? "Saving…" : `${logged ? "Update" : "Log"} sauna · ${value} min`}
        </button>

        {logged && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="min-h-11 w-full rounded-xl text-base font-medium text-danger active:bg-card disabled:opacity-40"
          >
            Remove sauna
          </button>
        )}
      </BottomSheet>
    </>
  );
}

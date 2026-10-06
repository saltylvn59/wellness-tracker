"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import { deleteCardio, logCardio } from "@/app/(tabs)/workouts/cardio-actions";
import {
  CARDIO,
  CARDIO_KINDS,
  readNumberField,
  summarizeCardio,
  type CardioKind,
  type CardioLogRow,
} from "@/lib/cardio";

// text-base = 16px: smaller text makes iPhone Safari zoom in when you tap a field.
const inputClass =
  "min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base";

// Three big buttons (Run, Cycle, Swim). Each opens a sheet where you can enter a
// distance and a time (both optional) and save. Today's cardio is listed below.
export default function CardioLogger({ date, logs }: { date: string; logs: CardioLogRow[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<CardioKind | null>(null); // which sheet is open
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openSheet(next: CardioKind) {
    setKind(next);
    setDistance("");
    setMinutes("");
    setError(null);
  }

  function save() {
    if (!kind) return;
    const d = readNumberField(distance);
    const m = readNumberField(minutes);
    if (d === "invalid" || m === "invalid") {
      setError("Enter numbers only, like 3.1 or 28.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await logCardio({ date, kind, distance: d, minutes: m });
      if (result.ok) {
        setKind(null);
        router.refresh();
      } else setError(result.message);
    });
  }

  function remove(log: CardioLogRow) {
    if (!window.confirm(`Delete this ${CARDIO[log.kind].label.toLowerCase()}?`)) return;
    startTransition(async () => {
      const result = await deleteCardio(log.id);
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  const active = kind ? CARDIO[kind] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {CARDIO_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => openSheet(k)}
            className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl bg-card text-base font-semibold active:opacity-80"
          >
            <span className="text-3xl" aria-hidden="true">
              {CARDIO[k].icon}
            </span>
            Log {CARDIO[k].label.toLowerCase()}
          </button>
        ))}
      </div>

      {logs.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {logs.map((log) => (
            <li key={log.id} className="flex min-h-14 items-center justify-between gap-3 px-4">
              <span className="min-w-0 text-base">
                <span aria-hidden="true">{CARDIO[log.kind].icon}</span>{" "}
                <span className="font-medium">{CARDIO[log.kind].label}</span>
                <span className="ml-2 text-sm text-muted">
                  {summarizeCardio(log.distance, log.unit, log.minutes)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(log)}
                disabled={pending}
                aria-label={`Delete ${CARDIO[log.kind].label}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-danger active:bg-border disabled:opacity-40"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {logs.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          Nothing logged for this day yet.
        </p>
      )}
      {error && kind === null && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <BottomSheet open={kind !== null} onClose={() => setKind(null)} label={`Log ${active?.label ?? "cardio"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">
              <span aria-hidden="true">{active?.icon}</span> Log {active?.label.toLowerCase()}
            </h2>
            <p className="text-sm text-muted">Distance and time are both optional.</p>
          </div>
          <button
            type="button"
            onClick={() => setKind(null)}
            className="min-h-11 shrink-0 rounded-xl px-3 text-base font-semibold text-accent active:opacity-70"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cardio-distance" className="mb-1 block text-sm font-medium text-muted">
              Distance ({active?.unit === "yd" ? "yards" : "miles"})
            </label>
            <input
              id="cardio-distance"
              type="text"
              inputMode="decimal"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              placeholder={active?.unit === "yd" ? "e.g. 1500" : "e.g. 3.1"}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cardio-minutes" className="mb-1 block text-sm font-medium text-muted">
              Time (minutes)
            </label>
            <input
              id="cardio-minutes"
              type="text"
              inputMode="decimal"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              placeholder="e.g. 28"
              className={inputClass}
            />
          </div>
        </div>

        {error && kind !== null && (
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
          {pending ? "Saving…" : `Log ${active?.label.toLowerCase()}`}
        </button>
      </BottomSheet>
    </div>
  );
}

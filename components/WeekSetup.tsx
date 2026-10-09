"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BottomSheet from "@/components/BottomSheet";
import { saveWeekKinds } from "@/app/(tabs)/workouts/week-actions";
import type { DayKind } from "@/lib/workouts/defaults";
import { DAY_KINDS, describeWeek, KIND_ICON, KIND_NAME } from "@/lib/workouts/weekSetup";

const SHORT = ["M", "T", "W", "T", "F", "S", "S"]; // Monday first, like the calendar
const LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// "Your week" at the top of the Fitness tab: which days are lifting, cardio, or rest.
// Tap it (or Edit) to change them: one row per day with Lift / Cardio / Rest buttons.
export default function WeekSetup({ days }: { days: { weekday: number; kind: DayKind }[] }) {
  const router = useRouter();
  const saved = SHORT.map((_, i) => days.find((d) => d.weekday === i + 1)?.kind ?? "rest");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayKind[]>(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openSheet() {
    setDraft(saved);
    setError(null);
    setOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveWeekKinds(Object.fromEntries(draft.map((kind, i) => [i + 1, kind])));
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else setError(result.message);
    });
  }

  return (
    <section aria-label="Your week" className="rounded-2xl bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted">
          <span className="font-semibold text-foreground">Your week</span> · {describeWeek(saved)}
        </p>
        <button
          type="button"
          onClick={openSheet}
          className="min-h-11 shrink-0 px-2 text-sm font-semibold text-accent active:opacity-70"
        >
          Edit
        </button>
      </div>
      <button type="button" onClick={openSheet} aria-label="Edit your week" className="grid w-full grid-cols-7 pb-1 active:opacity-70">
        {saved.map((kind, i) => (
          <span key={i} className="flex flex-col items-center gap-0.5" title={`${LONG[i]}: ${KIND_NAME[kind]}`}>
            <span className="text-xs font-medium text-muted">{SHORT[i]}</span>
            <span className="text-lg leading-none" aria-hidden="true">
              {KIND_ICON[kind]}
            </span>
          </span>
        ))}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} label="Set your week">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Your week</h2>
            <p className="text-sm text-muted">Pick lifting, cardio, or rest for each day.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 shrink-0 rounded-xl px-3 text-base font-semibold text-accent active:opacity-70"
          >
            Cancel
          </button>
        </div>

        <ul className="space-y-2">
          {draft.map((kind, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-sm font-semibold">{LONG[i].slice(0, 3)}</span>
              <div role="radiogroup" aria-label={LONG[i]} className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-card p-1">
                {DAY_KINDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={kind === option}
                    onClick={() => setDraft((week) => week.map((k, j) => (j === i ? option : k)))}
                    className={`min-h-11 rounded-lg text-sm font-medium active:opacity-70 ${
                      kind === option ? "bg-accent text-on-accent" : "text-muted"
                    }`}
                  >
                    <span aria-hidden="true">{KIND_ICON[option]}</span> {option === "lift" ? "Lift" : KIND_NAME[option]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted">
          Switching a lifting day to cardio keeps its exercises, so switching it back brings them back.
        </p>

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
          {pending ? "Saving…" : `Save week · ${describeWeek(draft)}`}
        </button>
      </BottomSheet>
    </section>
  );
}

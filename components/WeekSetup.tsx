"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveWeekKinds } from "@/app/(tabs)/workouts/week-actions";
import type { DayKind } from "@/lib/workouts/defaults";
import { PLANNABLE_WEEKDAYS, toggleDay } from "@/lib/workouts/weekSetup";

const LETTERS = ["M", "T", "W", "TH", "F", "S"]; // Monday to Saturday; Sunday is always recovery
const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ROWS = [
  { kind: "lift", label: "Lift days" },
  { kind: "cardio", label: "Cardio days" },
] as const;

const SAVE_DELAY_MS = 600; // wait for a short pause in tapping, then save once

// "Your week" on the Fitness tab: two rows of day toggles, Lift days and Cardio days.
// A day turns green when it's on. A day can be one or the other, so turning it on in
// one row turns it off in the other; a day that's off in both is a rest day.
// Changes save by themselves a moment after you stop tapping.
export default function WeekSetup({ days }: { days: { weekday: number; kind: DayKind }[] }) {
  const router = useRouter();
  const [kinds, setKinds] = useState<DayKind[]>(() =>
    PLANNABLE_WEEKDAYS.map((weekday) => days.find((d) => d.weekday === weekday)?.kind ?? "rest"),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef(kinds); // what the server has, to undo a failed save
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function tap(index: number, row: "lift" | "cardio") {
    const next = toggleDay(kinds, index, row);
    setKinds(next);
    setError(null);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await saveWeekKinds(Object.fromEntries(next.map((kind, i) => [PLANNABLE_WEEKDAYS[i], kind])));
      if (result.ok) {
        lastSaved.current = next;
        setStatus("saved");
        router.refresh();
      } else {
        setKinds(lastSaved.current); // put the toggles back the way they're saved
        setError(result.message);
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  }

  return (
    <section aria-label="Your week" className="space-y-2 rounded-2xl bg-card px-4 py-3">
      {ROWS.map((row) => (
        <div key={row.kind} className="space-y-1">
          <p className="text-xs font-semibold text-muted">{row.label}</p>
          <div className="grid grid-cols-6 gap-1.5">
            {LETTERS.map((letter, i) => {
              const on = kinds[i] === row.kind;
              return (
                <button
                  key={letter}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${NAMES[i]} ${row.kind === "lift" ? "lifting" : "cardio"}`}
                  onClick={() => tap(i, row.kind)}
                  className={`min-h-11 rounded-xl text-sm font-semibold active:opacity-70 ${
                    on ? "bg-accent text-on-accent" : "bg-background text-muted"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p role="status" className={`min-h-4 text-xs ${status === "error" ? "text-danger" : "text-muted"}`}>
        {status === "error" ? error : status === "saving" ? "Saving…" : status === "saved" ? "Saved." : "Sunday is always a recovery day."}
      </p>
    </section>
  );
}

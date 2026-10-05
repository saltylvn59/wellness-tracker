"use client";

import { useActionState } from "react";
import { saveCalorieGoal, type SaveResult } from "@/app/(tabs)/settings/actions";

export default function CalorieGoalForm({ currentGoal }: { currentGoal: number | null }) {
  // useActionState connects the form to the server action and gives us its reply.
  const [result, formAction, pending] = useActionState<SaveResult, FormData>(
    saveCalorieGoal,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="calorie_goal" className="block text-sm font-medium text-muted">
        Daily calorie goal
      </label>
      <div className="flex gap-2">
        <input
          id="calorie_goal"
          name="calorie_goal"
          type="number"
          inputMode="numeric"
          min={500}
          max={10000}
          step={1}
          defaultValue={currentGoal ?? ""}
          placeholder="e.g. 2000"
          required
          // text-base = 16px: smaller text makes iPhone Safari zoom in on focus
          className="min-h-12 flex-1 rounded-xl border border-border bg-background px-4 text-base"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-xl bg-accent px-5 text-base font-semibold text-on-accent active:opacity-80 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {result && (
        <p
          role="status"
          className={`text-sm ${result.ok ? "text-accent" : "text-danger"}`}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}

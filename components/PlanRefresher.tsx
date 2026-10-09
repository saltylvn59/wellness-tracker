"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshWeightPlan } from "@/app/(tabs)/weight/actions";

// Shown on the Weight tab when your numbers changed since the last suggested pace
// (a new weigh-in, or a new start or target in Settings). It asks the server to update
// the plan (the AI's pace and note) once, then reloads the numbers on screen.
export default function PlanRefresher({ today }: { today: string }) {
  const router = useRouter();
  const started = useRef(false); // only once, even if React runs effects twice in development
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    refreshWeightPlan(today).then((result) => {
      if (result.ok) router.refresh();
      else setFailed(true);
    });
  }, [router, today]);

  return (
    <p role="status" className="text-xs text-muted">
      {failed ? "Couldn't update your plan. It'll try again next time." : "✨ Updating your plan…"}
    </p>
  );
}

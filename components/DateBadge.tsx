"use client";

import { useSyncExternalStore } from "react";

// Today's date inside a circle. In milestone 3 the ring color will turn
// green (at/under calorie goal) or red (over). For now it is neutral.
//
// Why useSyncExternalStore? The server that first builds this page may be in a
// different time zone than your phone. This hook lets React show a blank
// placeholder on the server and then switch to *your* local date once the
// browser takes over, with no mismatch errors.
const noSubscribe = () => () => {}; // the date doesn't "push" updates (yet)

// Local calendar date as "YYYY-MM-DD". A plain string keeps React happy,
// since it needs the same value back every time nothing has changed.
function getLocalDateKey() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

const getServerDateKey = () => null; // the server doesn't know your time zone

export default function DateBadge() {
  const dateKey = useSyncExternalStore(noSubscribe, getLocalDateKey, getServerDateKey);

  const today = dateKey ? new Date(`${dateKey}T12:00:00`) : null; // noon avoids edge cases
  const month = today?.toLocaleDateString("en-US", { month: "short" }) ?? "";
  const day = today?.getDate() ?? "";
  const weekday = today?.toLocaleDateString("en-US", { weekday: "long" }) ?? "";

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-muted"
        aria-hidden={!today}
      >
        <span className="text-xs font-medium uppercase leading-none text-muted">{month}</span>
        <span className="text-2xl font-bold leading-tight">{day}</span>
      </div>
      <div>
        <p className="text-xl font-semibold leading-tight">{weekday || " "}</p>
        <p className="text-sm text-muted">Today</p>
      </div>
    </div>
  );
}

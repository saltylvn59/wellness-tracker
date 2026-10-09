"use client";

import { memo, useCallback, useEffect, useRef } from "react";

const ITEM_HEIGHT = 44; // px per row

type Props = {
  label: string;
  options: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  rows?: 3 | 5; // rows you can see (the middle one is the selected one); 3 is more compact
  showLabel?: boolean; // the small title above the wheel (screen readers always get it)
};

// One row of the wheel. memo() = React skips redrawing a row unless its own text or
// "selected" state changed, so moving the wheel redraws 2 rows instead of all 431.
const WheelRow = memo(function WheelRow({
  index,
  text,
  selected,
  onPick,
}: {
  index: number;
  text: string;
  selected: boolean;
  onPick: (index: number) => void;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => onPick(index)}
      className={`flex snap-center snap-always items-center justify-center tabular-nums ${
        selected ? "text-2xl font-bold" : "text-lg text-muted"
      }`}
      style={{ height: ITEM_HEIGHT }}
    >
      {text}
    </div>
  );
});

// An iPhone-style scroll wheel. It's an ordinary scrollable list that "snaps"
// one row at a time (CSS scroll-snap); whichever row ends up in the middle band
// is the chosen value. Works with touch, mouse wheel, and the arrow keys.
export default function WheelPicker({ label, options, value, onChange, format = String, rows = 5, showLabel = true }: Props) {
  const PAD = ((rows - 1) / 2) * ITEM_HEIGHT; // lets the first and last rows reach the middle
  const fade = Math.round(PAD * 0.7); // the soft fades stop short of the selected row
  const scroller = useRef<HTMLDivElement>(null);
  const syncing = useRef(false); // true while WE are scrolling the wheel to match an outside change
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastEmitted = useRef<number | null>(null); // the value this wheel itself last reported

  const selectedIndex = Math.max(0, options.indexOf(value));

  // When the value is changed from OUTSIDE the wheel (e.g. the sheet opens, or
  // the next exercise loads), scroll the wheel to match. Skipped for changes the
  // wheel just made itself, so it never fights your finger.
  useEffect(() => {
    const el = scroller.current;
    if (!el || lastEmitted.current === value) return;
    syncing.current = true;
    el.scrollTo({ top: selectedIndex * ITEM_HEIGHT });
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncing.current = false;
    }, 250);
  }, [value, selectedIndex]);

  useEffect(() => () => clearTimeout(syncTimer.current), []);

  // The chosen value follows the row in the middle band LIVE as the wheel moves,
  // so what you see highlighted is always what gets saved, even if you tap
  // "Add set" while it's still settling.
  function handleScroll() {
    const el = scroller.current;
    if (!el || syncing.current) return;
    const index = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)));
    const picked = options[index];
    lastEmitted.current = picked;
    if (picked !== value) onChange(picked);
  }

  // Stable between redraws (useCallback), so the memoized rows don't redraw just for this.
  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.min(options.length - 1, Math.max(0, index));
      scroller.current?.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    },
    [options.length],
  );

  return (
    <div className="flex-1">
      {showLabel && <p className="mb-1 text-center text-xs font-medium text-muted">{label}</p>}
      <div className="relative" style={{ height: ITEM_HEIGHT * rows }}>
        <div
          ref={scroller}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              goTo(selectedIndex - 1);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              goTo(selectedIndex + 1);
            }
          }}
          className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain rounded-2xl bg-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: PAD, paddingBottom: PAD }}
        >
          {options.map((option, index) => (
            <WheelRow key={option} index={index} text={format(option)} selected={option === value} onPick={goTo} />
          ))}
        </div>

        {/* The band marking the selected row, and soft fades at the top and bottom. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 rounded-xl border-y-2 border-accent"
          style={{ top: PAD, height: ITEM_HEIGHT }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 rounded-t-2xl bg-gradient-to-b from-[var(--card)] to-transparent"
          style={{ height: fade }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-[var(--card)] to-transparent"
          style={{ height: fade }}
        />
      </div>
    </div>
  );
}

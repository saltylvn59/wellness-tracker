// The two "extras" on a lifting day, each a 10 minute checkbox:
//   sauna   at the start of the workout
//   stretch at the end of the workout

export type ExtraKind = "sauna" | "stretch";

export const EXTRAS: Record<
  ExtraKind,
  { column: "sauna_done" | "stretch_done"; minutes: number; label: string; icon: string; when: string }
> = {
  sauna: { column: "sauna_done", minutes: 10, label: "Sauna", icon: "🧖", when: "start of workout" },
  stretch: { column: "stretch_done", minutes: 10, label: "Stretch", icon: "🧘", when: "end of workout" },
};

/** Checks a value from the browser is really "sauna" or "stretch"; otherwise null. */
export function parseExtraKind(value: unknown): ExtraKind | null {
  return value === "sauna" || value === "stretch" ? value : null;
}

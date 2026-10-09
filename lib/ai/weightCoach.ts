// What we ask the AI about your weight goal, and how we check what it sends back.
// The AI suggests a weekly pace and writes one line of coaching. The app then does
// the weeks-to-goal math itself (lib/weightPlan.ts), so the numbers are always exact.

import { clampPace, type Direction } from "../weightPlan";

export type CoachInput = {
  start: number;
  current: number;
  target: number;
  direction: Exclude<Direction, "done">;
  trend: number | null; // your actual recent lb per week (negative = losing), if known
  weeksTracked: number; // weeks since your first weigh-in
};

export type CoachAdvice = { pace: number; note: string };

export const COACH_JSON_SCHEMA = {
  type: "object",
  properties: {
    pace_lb_per_week: {
      type: "number",
      description: "Recommended pounds per week toward the target (a positive number)",
    },
    note: {
      type: "string",
      description: "One short, encouraging sentence (under 140 characters) about the plan",
    },
  },
  required: ["pace_lb_per_week", "note"],
} as const;

export const COACH_SYSTEM_PROMPT = `You are a supportive fitness coach inside a weight-tracking app.

Given a person's starting, current and target body weight (in pounds) and their recent trend,
recommend a realistic, healthy weekly pace toward the target.
- For weight loss, about 0.5% to 1% of current body weight per week is typical. Suggest slower
  when they are close to the target, and do not exceed 2 lb per week.
- For weight gain, 0.25 to 1 lb per week (slower keeps it mostly muscle).
- If their recent trend is steady and healthy, you may match it.
- "note" is one short, warm, specific sentence. No medical claims, no emojis.`;

export function coachPrompt(input: CoachInput): string {
  const trend =
    input.trend === null
      ? "not enough weigh-ins yet"
      : `${input.trend > 0 ? "+" : ""}${input.trend.toFixed(1)} lb per week over the last 4 weeks`;
  return [
    `Goal: ${input.direction} weight.`,
    `Starting weight: ${input.start.toFixed(1)} lb.`,
    `Current weight: ${input.current.toFixed(1)} lb.`,
    `Target weight: ${input.target.toFixed(1)} lb.`,
    `Recent trend: ${trend}.`,
    `Weeks tracked so far: ${input.weeksTracked}.`,
  ].join("\n");
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Checks the AI's reply. The pace is pulled into the safe range; the note is trimmed. */
export function parseCoachAdvice(raw: unknown, direction: Exclude<Direction, "done">): CoachAdvice | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (!isRecord(data)) return null;

  const pace = typeof data.pace_lb_per_week === "string" ? Number(data.pace_lb_per_week) : data.pace_lb_per_week;
  if (typeof pace !== "number" || !Number.isFinite(pace) || pace <= 0) return null;

  const note = typeof data.note === "string" ? data.note.trim().replace(/\s+/g, " ").slice(0, 200) : "";
  return { pace: clampPace(pace, direction), note };
}

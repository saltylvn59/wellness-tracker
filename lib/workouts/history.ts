// Picks "last time's" numbers for an exercise out of your past sets.

export type HistoryRow = {
  exercise_id: string | null;
  session_date: string; // "YYYY-MM-DD"
  set_number: number;
  weight: number | null;
  reps: number | null;
};

export type LoggedSet = { weight: number; reps: number };

/** The sets from the most recent day you did this exercise, in set order. */
export function latestSets(rows: HistoryRow[], exerciseId: string): LoggedSet[] {
  const mine = rows.filter(
    (r) => r.exercise_id === exerciseId && r.weight !== null && r.reps !== null,
  );
  if (mine.length === 0) return [];

  const latestDate = mine.reduce((max, r) => (r.session_date > max ? r.session_date : max), "");
  return mine
    .filter((r) => r.session_date === latestDate)
    .sort((a, b) => a.set_number - b.set_number)
    .map((r) => ({ weight: Number(r.weight), reps: Number(r.reps) }));
}

import { redirect } from "next/navigation";
import CardioLogger, { type CardioLogRow } from "@/components/CardioLogger";
import FitnessHeader from "@/components/FitnessHeader";
import GoToToday from "@/components/GoToToday";
import { addDays, formatFullDate, formatWeekday, isoWeekday, isValidDateKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { loadDoneDates } from "@/lib/workouts/activity";
import { loadWorkoutDays } from "@/lib/workouts/seed";

export default async function CardioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  // No date in the address? Let the phone work out "today" and jump there.
  if (!date || !isValidDateKey(date)) return <GoToToday to="/cardio" />;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  const [days, doneDates, logsResult] = await Promise.all([
    loadWorkoutDays(supabase, userId),
    loadDoneDates(supabase, addDays(date, -400)),
    supabase
      .from("cardio_logs")
      .select("id, kind, distance, distance_unit, duration_minutes")
      .eq("log_date", date)
      .order("created_at", { ascending: true }),
  ]);

  const logs: CardioLogRow[] = (logsResult.data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as CardioLogRow["kind"],
    distance: row.distance === null ? null : Number(row.distance),
    unit: row.distance_unit as string | null,
    minutes: row.duration_minutes === null ? null : Number(row.duration_minutes),
  }));

  const planned = days.find((d) => d.weekday === isoWeekday(date));

  return (
    <div className="space-y-6">
      <FitnessHeader current="cardio" date={date} days={days} doneDates={doneDates} />

      <section className="space-y-1">
        <h2 className="text-lg font-semibold">
          {formatWeekday(date)}
          {planned ? <span className="text-muted"> · {planned.title}</span> : null}
        </h2>
        <p className="text-sm text-muted">
          {formatFullDate(date)}
          {planned && planned.kind !== "cardio" ? " · not a planned cardio day, but you can still log one" : ""}
        </p>
      </section>

      <CardioLogger date={date} logs={logs} />
    </div>
  );
}

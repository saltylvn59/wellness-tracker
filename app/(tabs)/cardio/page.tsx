import FitnessSwitch from "@/components/FitnessSwitch";
import { isValidDateKey } from "@/lib/dates";

export default async function CardioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fitness</h1>
      <FitnessSwitch current="cardio" date={date && isValidDateKey(date) ? date : undefined} />

      <section className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Log a run, ride, or swim with distance and time. Coming next.
      </section>
    </div>
  );
}

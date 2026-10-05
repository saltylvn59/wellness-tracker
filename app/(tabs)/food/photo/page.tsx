import Link from "next/link";
import AiEstimateFlow from "@/components/AiEstimateFlow";
import GoToToday from "@/components/GoToToday";
import { formatFullDate, isValidDateKey } from "@/lib/dates";

export default async function PhotoFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  if (!date || !isValidDateKey(date)) return <GoToToday to="/food/photo" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Take a picture</h1>
        <p className="text-sm text-muted">for {formatFullDate(date)}</p>
      </div>

      <AiEstimateFlow mode="photo" date={date} />

      <Link
        href={`/food/add?date=${date}`}
        className="flex min-h-12 items-center justify-center text-base text-muted active:opacity-70"
      >
        Back
      </Link>
    </div>
  );
}

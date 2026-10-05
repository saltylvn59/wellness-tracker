import Link from "next/link";
import GoToToday from "@/components/GoToToday";
import { formatFullDate, isValidDateKey } from "@/lib/dates";

const cardClass =
  "flex min-h-24 w-full items-center gap-4 rounded-2xl bg-card p-4 text-left active:opacity-80";

export default async function AddFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  if (!date || !isValidDateKey(date)) return <GoToToday to="/food/add" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add food</h1>
        <p className="text-sm text-muted">for {formatFullDate(date)}</p>
      </div>

      <div className="space-y-3">
        <Link href={`/food/saved?date=${date}`} className={cardClass}>
          <span className="text-3xl" aria-hidden="true">
            ⭐
          </span>
          <span>
            <span className="block text-base font-semibold">Saved foods</span>
            <span className="block text-sm text-muted">Pick something you&apos;ve logged before</span>
          </span>
        </Link>

        {/* The two AI options arrive in the next step. */}
        <div aria-disabled="true" className={`${cardClass} opacity-60`}>
          <span className="text-3xl" aria-hidden="true">
            📷
          </span>
          <span>
            <span className="block text-base font-semibold">Take a picture</span>
            <span className="block text-sm text-muted">
              AI estimates calories and macros · coming soon
            </span>
          </span>
        </div>

        <div aria-disabled="true" className={`${cardClass} opacity-60`}>
          <span className="text-3xl" aria-hidden="true">
            ✍️
          </span>
          <span>
            <span className="block text-base font-semibold">Describe your food</span>
            <span className="block text-sm text-muted">
              Type it, AI estimates calories and macros · coming soon
            </span>
          </span>
        </div>
      </div>

      <Link
        href={`/food/new?date=${date}`}
        className="flex min-h-12 items-center justify-center rounded-xl border border-border text-base font-medium active:opacity-80"
      >
        Enter calories manually
      </Link>

      <Link
        href={`/food?date=${date}`}
        className="flex min-h-12 items-center justify-center text-base text-muted active:opacity-70"
      >
        Cancel
      </Link>
    </div>
  );
}

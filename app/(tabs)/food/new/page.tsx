import FoodEntryForm from "@/components/FoodEntryForm";
import GoToToday from "@/components/GoToToday";
import { isValidDateKey } from "@/lib/dates";

export default async function NewFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  // No date given (e.g. a bookmark)? Let the phone pick today, then come back here.
  if (!date || !isValidDateKey(date)) return <GoToToday />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add food</h1>
      <FoodEntryForm defaultDate={date} />
    </div>
  );
}

import { notFound } from "next/navigation";
import DeleteSavedFoodForm from "@/components/DeleteSavedFoodForm";
import SavedFoodForm from "@/components/SavedFoodForm";
import { isValidDateKey } from "@/lib/dates";
import type { SavedFood } from "@/lib/food";
import { createClient } from "@/lib/supabase/server";

export default async function EditSavedFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: rawDate } = await searchParams;
  const date = rawDate && isValidDateKey(rawDate) ? rawDate : "";

  const supabase = await createClient();
  // Row Level Security hides other people's saved foods, so they simply "don't exist".
  const { data, error } = await supabase
    .from("saved_foods")
    .select("id, name, calories, protein_g, carbs_g, fat_g")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const food = data as SavedFood;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit saved food</h1>
      <SavedFoodForm food={food} date={date} />
      <DeleteSavedFoodForm id={food.id} date={date} />
    </div>
  );
}

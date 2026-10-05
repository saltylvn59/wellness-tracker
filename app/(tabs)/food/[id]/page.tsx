import { notFound } from "next/navigation";
import DeleteEntryForm from "@/components/DeleteEntryForm";
import FoodEntryForm from "@/components/FoodEntryForm";
import { createClient } from "@/lib/supabase/server";
import type { FoodEntry } from "@/lib/food";

export default async function EditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  // Row Level Security hides other people's entries, so they simply "don't exist".
  const { data, error } = await supabase
    .from("food_entries")
    .select("id, entry_date, meal_type, name, calories, protein_g, carbs_g, fat_g, source")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const entry = data as FoodEntry;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit food</h1>
      <FoodEntryForm entry={entry} defaultDate={entry.entry_date} />
      <DeleteEntryForm id={entry.id} entryDate={entry.entry_date} />
    </div>
  );
}

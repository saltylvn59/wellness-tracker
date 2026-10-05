"use client";

import { deleteSavedFood } from "@/app/(tabs)/food/saved/actions";

// Removes a food from your Saved foods list. Foods you already logged stay put.
export default function DeleteSavedFoodForm({ id, date }: { id: string; date: string }) {
  return (
    <form action={deleteSavedFood}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="date" value={date} />
      <button
        type="submit"
        onClick={(event) => {
          if (!window.confirm("Remove this from your saved foods?")) event.preventDefault();
        }}
        className="min-h-12 w-full rounded-xl text-base font-medium text-danger active:bg-card"
      >
        Remove from saved foods
      </button>
    </form>
  );
}

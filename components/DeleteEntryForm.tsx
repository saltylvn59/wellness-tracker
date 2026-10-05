"use client";

import { deleteFoodEntry } from "@/app/(tabs)/food/actions";

// A separate form (forms can't be nested) with a "are you sure?" prompt.
export default function DeleteEntryForm({ id, entryDate }: { id: string; entryDate: string }) {
  return (
    <form action={deleteFoodEntry}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="entry_date" value={entryDate} />
      <button
        type="submit"
        onClick={(event) => {
          if (!window.confirm("Delete this entry?")) event.preventDefault();
        }}
        className="min-h-12 w-full rounded-xl text-base font-medium text-danger active:bg-card"
      >
        Delete entry
      </button>
    </form>
  );
}

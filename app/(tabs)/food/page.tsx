import DateBadge from "@/components/DateBadge";

export default function FoodPage() {
  return (
    <div className="space-y-6">
      <DateBadge />

      <section className="rounded-2xl bg-card p-4">
        <h2 className="text-sm font-medium text-muted">Calories</h2>
        <p className="mt-1 text-3xl font-bold">
          0 <span className="text-base font-medium text-muted">kcal eaten</span>
        </p>
        <p className="mt-2 text-sm text-muted">Daily goal not set yet.</p>
      </section>

      <section className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Your meals will show up here. Photo and text logging are coming soon.
      </section>
    </div>
  );
}

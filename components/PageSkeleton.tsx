// What a tab shows the instant you tap it, while its data loads: the title and grey
// placeholder cards. Used by each tab's loading.tsx, which Next.js also fetches ahead of
// time, so switching tabs responds immediately.
export default function PageSkeleton({ title, cards }: { title: string; cards: number[] }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={`Loading ${title}`}>
      <div className="flex h-11 items-center">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {cards.map((height, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-card" style={{ height }} />
      ))}
    </div>
  );
}

import PageSkeleton from "@/components/PageSkeleton";

// Shown instantly while the Weight tab loads (see PageSkeleton).
export default function Loading() {
  return <PageSkeleton title="Weight" cards={[300, 230]} />;
}

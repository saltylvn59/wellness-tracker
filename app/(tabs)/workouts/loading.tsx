import PageSkeleton from "@/components/PageSkeleton";

// Shown instantly while the Fitness tab loads (see PageSkeleton).
export default function Loading() {
  return <PageSkeleton title="Fitness" cards={[76, 96, 88, 200]} />;
}

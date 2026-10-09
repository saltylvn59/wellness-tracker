import PageSkeleton from "@/components/PageSkeleton";

// Shown instantly while the Nutrition tab loads (see PageSkeleton).
export default function Loading() {
  return <PageSkeleton title="Nutrition" cards={[76, 88, 160, 48]} />;
}

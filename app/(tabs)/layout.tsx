import TabBar from "@/components/TabBar";

// (tabs) is a "route group": the parentheses mean the folder name is NOT part
// of the URL, so /food, /workouts and /cardio all share this layout (the tab bar).
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* pt = room for the notch; pb = room so content isn't hidden behind the tab bar */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
        {children}
      </main>
      <TabBar />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/food", label: "Food", icon: "🍎" },
  { href: "/workouts", label: "Workouts", icon: "🏋️" },
  { href: "/cardio", label: "Cardio", icon: "🏃" },
];

// "use client" (above) means this runs in the browser, which we need here
// because it checks which page is open (usePathname) to highlight the tab.
export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      // fixed = stays pinned to the bottom of the screen.
      // pb-[env(safe-area-inset-bottom)] = leave room for the iPhone home bar.
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                // min-h-14 = 56px tall, comfortably above the 44px tap-target minimum
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                <span
                  className={`text-xl leading-none ${active ? "" : "opacity-50 grayscale"}`}
                  aria-hidden="true"
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

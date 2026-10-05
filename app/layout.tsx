import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// <head> info: the browser tab title, and the settings iPhone Safari reads
// when you tap "Add to Home Screen".
export const metadata: Metadata = {
  title: "Wellness Tracker",
  description: "Track calories, macros, workouts, and cardio in one place.",
  appleWebApp: {
    capable: true, // open full-screen (no Safari toolbars) from the home screen
    title: "Wellness",
    statusBarStyle: "default",
  },
};

// How the page fits the phone screen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // let the page extend under the notch / home bar
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

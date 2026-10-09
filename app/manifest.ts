import type { MetadataRoute } from "next";

// The "web app manifest": tells the phone this website can be installed
// and how it should look when launched from the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DEVELOP",
    short_name: "DEVELOP",
    description: "DEVELOP: a wellness tracker for calories, macros, workouts, and cardio.",
    start_url: "/food",
    display: "standalone", // full-screen, like a native app
    background_color: "#000000", // black behind the icon while the app opens, to match it
    theme_color: "#000000", // black system bars, to match the icon
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}

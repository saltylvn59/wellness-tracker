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
    background_color: "#ffffff",
    theme_color: "#34c759", // Apple system green
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}

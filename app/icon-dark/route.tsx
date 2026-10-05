import { ImageResponse } from "next/og";

// Dark-mode version of the icon: a green "W" on the app's dark background.
// Browsers show this in the tab when the device is in dark mode (see the
// <link media="(prefers-color-scheme: dark)"> in app/layout.tsx).
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#30d158",
          fontSize: 320,
          fontWeight: 700,
        }}
      >
        W
      </div>
    ),
    { width: 512, height: 512 },
  );
}

import { ImageResponse } from "next/og";

// The icon iPhones use on the home screen (the "apple-touch-icon"): a green "W"
// on a dark square. iOS rounds the corners itself, so we draw a plain full square.
// (An iPhone saves one fixed image, so it can't switch between light and dark.)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a", // same as the app's dark-mode background
          color: "#30d158", // Apple's dark-mode green
          fontSize: 112,
          fontWeight: 700,
        }}
      >
        W
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

// Placeholder app icon (a white "W" on Apple green), drawn in code so we
// don't need an image file. Swap in a real design later.
// (A dark-mode variant for browser tabs lives in app/icon-dark/route.tsx.)
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#34c759",
          color: "white",
          fontSize: 320,
          fontWeight: 700,
        }}
      >
        W
      </div>
    ),
    size,
  );
}

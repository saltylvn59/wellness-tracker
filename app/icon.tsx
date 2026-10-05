import { ImageResponse } from "next/og";

// Placeholder app icon (a green square with a "W"), drawn in code so we
// don't need an image file. Swap in a real design later.
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
          background: "#16a34a",
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

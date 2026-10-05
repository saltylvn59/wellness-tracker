import { ImageResponse } from "next/og";

// The app icon, drawn in code (no image files): three progress rings, like a
// fitness tracker, each partly filled. One drawing, two looks:
//   "dark":  glowing green rings on a deep dark background (home screen, dark browser tabs)
//   "light": white rings on an Apple-green gradient (light browser tabs)
//
// Note: the image renderer only allows plain SVG tags inside <svg> (no React
// fragments or custom components), so everything is wrapped in <g> groups.

export type IconVariant = "dark" | "light";

// Outer, middle, inner ring: radius and how much of the circle is filled.
const RINGS = [
  { r: 172, fill: 0.78 },
  { r: 124, fill: 0.62 },
  { r: 76, fill: 0.46 },
] as const;

const STROKE = 38;

const LOOKS = {
  dark: {
    bgTop: "#0f1f15",
    bgBottom: "#050605",
    glow: true,
    track: { color: "#30d158", opacity: 0.16 },
    rings: [
      { color: "#30d158", opacity: 1 },
      { color: "#6cf08f", opacity: 1 },
      { color: "#b5ffc9", opacity: 1 },
    ],
  },
  light: {
    bgTop: "#4ddb73",
    bgBottom: "#25a84a",
    glow: false,
    track: { color: "#ffffff", opacity: 0.24 },
    rings: [
      { color: "#ffffff", opacity: 1 },
      { color: "#ffffff", opacity: 0.88 },
      { color: "#ffffff", opacity: 0.76 },
    ],
  },
};

function iconSvg(variant: IconVariant, size: number) {
  const look = LOOKS[variant];

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.bgTop} />
          <stop offset="1" stopColor={look.bgBottom} />
        </linearGradient>
        {/* soft light behind the rings (dark version only) */}
        <radialGradient id="glow" cx="0.5" cy="0.46" r="0.55">
          <stop offset="0" stopColor="#30d158" stopOpacity="0.38" />
          <stop offset="1" stopColor="#30d158" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="512" height="512" fill="url(#bg)" />
      <rect width="512" height="512" fill="url(#glow)" fillOpacity={look.glow ? 1 : 0} />

      {RINGS.map(({ r, fill }, index) => {
        const circumference = 2 * Math.PI * r;
        const ring = look.rings[index];
        return (
          <g key={r}>
            {/* the faint full circle behind each ring */}
            <circle
              cx="256"
              cy="256"
              r={r}
              fill="none"
              stroke={look.track.color}
              strokeOpacity={look.track.opacity}
              strokeWidth={STROKE}
            />
            {/* the filled part, starting at the top and going clockwise */}
            <circle
              cx="256"
              cy="256"
              r={r}
              fill="none"
              stroke={ring.color}
              strokeOpacity={ring.opacity}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference * fill} ${circumference}`}
              transform="rotate(-90 256 256)"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function renderIcon(size: number, variant: IconVariant) {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>{iconSvg(variant, size)}</div>,
    { width: size, height: size },
  );
}

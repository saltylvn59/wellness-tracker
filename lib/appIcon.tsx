import { ImageResponse } from "next/og";

// The app icon, drawn in code (no image files). One drawing, two looks:
//   "dark":  a glowing green W on a deep dark background (home screen, dark browser tabs)
//   "light": a white W on an Apple-green gradient (light browser tabs)
// The W is a single rounded line that rises and falls like a heartbeat.
//
// Note: the image renderer only allows plain SVG tags inside <svg> (no React
// fragments or custom components), so the gradient stops are built with .map().

export type IconVariant = "dark" | "light";

// Points of the W on a 512 x 512 canvas.
const W_PATH = "M104 160 L180 350 L256 214 L332 350 L408 160";

type Stop = [offset: string, color: string];

const LOOKS = {
  dark: {
    background: [["0", "#0f1f15"], ["1", "#050605"]] as Stop[],
    stroke: [["0", "#9bffb4"], ["1", "#30d158"]] as Stop[],
  },
  light: {
    background: [["0", "#4ddb73"], ["1", "#25a84a"]] as Stop[],
    stroke: [["0", "#ffffff"], ["1", "#e9fff0"]] as Stop[],
  },
};

function stops(list: Stop[]) {
  return list.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />);
}

function iconSvg(variant: IconVariant, size: number) {
  const look = LOOKS[variant];
  const dark = variant === "dark";

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          {stops(look.background)}
        </linearGradient>
        {/* soft light behind the W (dark version only) */}
        <radialGradient id="glow" cx="0.5" cy="0.46" r="0.55">
          <stop offset="0" stopColor="#30d158" stopOpacity="0.42" />
          <stop offset="1" stopColor="#30d158" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stroke" x1="0" y1="0" x2="0" y2="1">
          {stops(look.stroke)}
        </linearGradient>
      </defs>

      <rect width="512" height="512" fill="url(#bg)" />
      <rect width="512" height="512" fill="url(#glow)" fillOpacity={dark ? 1 : 0} />

      {/* a wider, fainter copy of the W underneath gives it a neon edge */}
      <path
        d={W_PATH}
        fill="none"
        stroke="#30d158"
        strokeOpacity={dark ? 0.28 : 0}
        strokeWidth="72"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={W_PATH}
        fill="none"
        stroke="url(#stroke)"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function renderIcon(size: number, variant: IconVariant) {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>{iconSvg(variant, size)}</div>,
    { width: size, height: size },
  );
}

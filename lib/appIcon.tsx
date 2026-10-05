import { ImageResponse } from "next/og";

// The app icon, drawn in code (no image files): a green line graph trending
// upward on a black background, with a dot at each point (what progress looks
// like). The last dot is bigger, with a halo, because that's where you are now.
//
// iPhones let a web app have only ONE home-screen icon (it can't switch between
// light and dark), so this dark icon is used for the home screen and every
// browser tab.
//
// Note: the image renderer only allows plain SVG tags inside <svg> (no React
// fragments or custom components), so everything is wrapped in <g> groups.

// The data points on a 512 x 512 canvas: mostly up, with one small dip so it
// looks like real progress rather than a ruler.
const POINTS: [number, number][] = [
  [88, 378],
  [178, 318],
  [262, 338],
  [350, 214],
  [432, 124],
];

const LINE = POINTS.map(([x, y]) => `${x},${y}`).join(" ");

const GREEN = "#30d158"; // Apple's green for dark backgrounds
const BLACK = "#000000";

function iconSvg(size: number) {
  const last = POINTS[POINTS.length - 1];

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill={BLACK} />

      {/* the connecting line */}
      <polyline
        points={LINE}
        fill="none"
        stroke={GREEN}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* a dot at every point; each has a black center so it reads as a node */}
      {POINTS.slice(0, -1).map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="27" fill={GREEN} />
          <circle cx={x} cy={y} r="11" fill={BLACK} />
        </g>
      ))}

      {/* the last dot is bigger, with a halo: where you are now */}
      <g>
        <circle cx={last[0]} cy={last[1]} r="52" fill={GREEN} fillOpacity={0.22} />
        <circle cx={last[0]} cy={last[1]} r="36" fill={GREEN} />
        <circle cx={last[0]} cy={last[1]} r="15" fill={BLACK} />
      </g>
    </svg>
  );
}

export function renderIcon(size: number) {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>{iconSvg(size)}</div>,
    { width: size, height: size },
  );
}

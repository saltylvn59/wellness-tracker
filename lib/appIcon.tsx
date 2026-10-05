import { ImageResponse } from "next/og";

// The app icon, drawn in code (no image files): a line graph trending upward,
// with a dot at each point, which is what progress looks like. The last dot is
// bigger, with a halo, because that's where you are now.
//
// The colors match the iPhone Messages app: a bright green gradient with white
// artwork. The same drawing is used for the home screen and every browser tab.
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

// Messages-style green: lighter at the top, deeper at the bottom.
const GREEN_TOP = "#63f07a";
const GREEN_BOTTOM = "#14c53a";

function iconSvg(size: number) {
  const last = POINTS[POINTS.length - 1];

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GREEN_TOP} />
          <stop offset="1" stopColor={GREEN_BOTTOM} />
        </linearGradient>
      </defs>

      <rect width="512" height="512" fill="url(#bg)" />

      {/* the connecting line */}
      <polyline
        points={LINE}
        fill="none"
        stroke="#ffffff"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* a dot at every point; each has a green center so it reads as a node */}
      {POINTS.slice(0, -1).map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="27" fill="#ffffff" />
          <circle cx={x} cy={y} r="11" fill="#2fcf55" />
        </g>
      ))}

      {/* the last dot is bigger, with a halo: where you are now */}
      <g>
        <circle cx={last[0]} cy={last[1]} r="52" fill="#ffffff" fillOpacity={0.24} />
        <circle cx={last[0]} cy={last[1]} r="36" fill="#ffffff" />
        <circle cx={last[0]} cy={last[1]} r="15" fill="#2fcf55" />
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

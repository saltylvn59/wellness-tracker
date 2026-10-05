import { renderIcon } from "@/lib/appIcon";

// The icon iPhones use on the home screen (the "apple-touch-icon"): the glowing
// green W on a dark square. iOS rounds the corners itself, so we draw a plain
// full square. (An iPhone saves one fixed image, so it can't switch light/dark.)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(180, "dark");
}

import { renderIcon } from "@/lib/appIcon";

// The icon iPhones use on the home screen (the "apple-touch-icon"): a green
// progress graph on black. iOS rounds the corners itself, so we
// draw a plain full square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(180);
}

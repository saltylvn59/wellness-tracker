import { renderIcon } from "@/lib/appIcon";

// The icon iPhones use on the home screen (the "apple-touch-icon"): a white
// progress graph on Messages-style green. iOS rounds the corners itself, so we
// draw a plain full square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(180);
}

import { renderIcon } from "@/lib/appIcon";

// The browser-tab and manifest icon: the same black-and-green progress graph as
// the home-screen icon (see lib/appIcon.tsx).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(512);
}

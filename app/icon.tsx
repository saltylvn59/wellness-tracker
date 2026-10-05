import { renderIcon } from "@/lib/appIcon";

// The browser-tab and manifest icon (light look): a white W on Apple green.
// A dark-mode tab icon lives in app/icon-dark/route.tsx; both use lib/appIcon.tsx.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return renderIcon(512, "light");
}

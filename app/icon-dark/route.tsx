import { renderIcon } from "@/lib/appIcon";

// Dark-mode version of the icon, shown in the browser tab when the device is in
// dark mode (see the <link media="(prefers-color-scheme: dark)"> in app/layout.tsx).
export function GET() {
  return renderIcon(512, "dark");
}

import { renderIcon } from "@/lib/appIcon";

// Draws the app icon at any size, ONLY on your Mac (npm run dev), so the icon files in
// public/ can be regenerated after a design change in lib/appIcon.tsx:
//   npm run icons   (with npm run dev running)
// On the live site this returns "not found": the phone uses the plain PNG files instead.
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (process.env.NODE_ENV === "production" || !Number.isInteger(size) || size < 16 || size > 1024) {
    return new Response("Not found", { status: 404 });
  }
  return renderIcon(size);
}

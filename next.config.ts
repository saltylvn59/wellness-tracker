import type { NextConfig } from "next";

// Safe browser-protection headers for every page.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" }, // don't guess file types
  { key: "X-Frame-Options", value: "DENY" }, // no one can embed the app in another site
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise "Next.js" in every response
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

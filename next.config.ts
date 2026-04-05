import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "playwright", "@sparticuz/chromium"],
  async rewrites() {
    return [
      // Legacy embeds / cached widget.js may still call NextAuth's path; forward to Clerk-backed session.
      { source: "/api/auth/session", destination: "/api/session" },
      // Serve the static widget (no App Route) so cross-origin <script src> always gets real JS + ORB-safe headers.
      { source: "/api/embed", destination: "/widget.js" },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/widget.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          // Allow embedding <script src="https://your-app/widget.js"> on other sites (avoids ORB blocking in Chromium).
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
      // Same as /widget.js — used by older embeds; rewrite targets /widget.js but URL stays /api/embed.
      {
        source: "/api/embed",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
      // Do not apply nosniff to /widget.js or /api/embed — can trigger ORB on cross-origin <script src>.
      {
        source: "/((?!widget\\.js$)(?!api/embed$)(?!sw\\.js$).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

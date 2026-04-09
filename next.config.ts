import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "playwright", "@sparticuz/chromium"],
  async rewrites() {
    return [
      // Legacy embeds / cached widget.js may still call NextAuth's path; forward to Clerk-backed session.
      { source: "/api/auth/session", destination: "/api/session" },
      // Serve the static widget (no App Route) so cross-origin <script src> always gets real JS + ORB-safe headers.
      // Same JS as /widget.js but served by /embed/widget.js (can inject Vercel protection bypass).
      { source: "/api/embed", destination: "/embed/widget.js" },
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
      {
        source: "/embed/widget.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
      {
        source: "/embed/widget-js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
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
      // Chat shell loaded inside cross-origin iframes — must not send X-Frame-Options: SAMEORIGIN.
      {
        source: "/embed/chat",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      // Do not apply nosniff to /widget.js or /api/embed — can trigger ORB on cross-origin <script src>.
      {
        source: "/((?!widget\\.js$)(?!api/embed$)(?!embed/widget\\.js$)(?!embed/widget-js$)(?!embed/chat$)(?!sw\\.js$).*)",
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

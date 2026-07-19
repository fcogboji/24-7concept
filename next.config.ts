import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // @prisma/instrumentation uses dynamic require() that webpack can't statically analyze;
  // keeping it external silences the "Critical dependency" warning from the Sentry import chain.
  serverExternalPackages: [
    "playwright-core",
    "playwright",
    "@sparticuz/chromium",
    "@prisma/instrumentation",
  ],
  async redirects() {
    return [
      /**
       * Clerk session cookies are host-scoped. Mixing apex (faztino.com) and www
       * breaks /dashboard and /admin (users look "logged in" on public pages then
       * get bounced to /login). Always use the www host in production.
       */
      {
        source: "/:path*",
        has: [{ type: "host", value: "faztino.com" }],
        destination: "https://www.faztino.com/:path*",
        permanent: true,
      },
    ];
  },
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
            value: [
              "frame-ancestors *",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.faztino.com https://challenges.cloudflare.com https://js.stripe.com https://js.paystack.co",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.faztino.com https://clerk-telemetry.com https://challenges.cloudflare.com https://api.stripe.com https://api.paystack.co",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.faztino.com https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com",
              "worker-src 'self' blob:",
            ].join("; "),
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            // 'unsafe-inline' is required by Next.js inline runtime/hydration scripts and Tailwind <style> tags.
            // Clerk + Stripe + Paystack iframes need their hosts in frame-src and connect-src.
            // Tightening further (nonces / strict-dynamic) is a Phase 2 follow-up.
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              // Clerk sign-in forms may post to the Frontend API host (custom domain).
              "form-action 'self' https://clerk.faztino.com https://*.clerk.accounts.dev https://*.clerk.com https://checkout.stripe.com https://checkout.paystack.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              // challenges.cloudflare.com hosts Clerk's Turnstile bot-protection widget; the login UI
              // shows "CAPTCHA failed to load" when it is missing from script/frame/connect-src.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://*.clerk.com https://clerk.faztino.com https://challenges.cloudflare.com https://js.stripe.com https://js.paystack.co`,
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.faztino.com https://clerk-telemetry.com https://challenges.cloudflare.com https://api.stripe.com https://api.paystack.co https://*.upstash.io https://*.neon.tech",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.faztino.com https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

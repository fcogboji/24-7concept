import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/verify-email(.*)",
  "/widget.js",
  // SEO + favicon. Googlebot crawls signed-out, so these must bypass auth or the
  // search result shows a generic globe icon and the sitemap/robots are unreachable.
  "/icon(.*)",
  "/apple-icon(.*)",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
  // All embed routes (widget-js, chat, future paths) must stay public for third-party iframes/scripts.
  "/embed(.*)",
  "/api/chat(.*)",
  "/api/bots/(.*)/suggestions",
  "/api/leads(.*)",
  "/api/health(.*)",
  "/api/session(.*)",
  "/api/embed(.*)",
  "/api/stripe/webhook(.*)",
  "/admin/sign-in(.*)",
  "/admin/unauthorized(.*)",
]);

/** Set CLERK_FRONTEND_API_PROXY=0 to skip same-origin `/__clerk` proxy (see .env.example). */
const useClerkFrontendApiProxy =
  process.env.CLERK_FRONTEND_API_PROXY !== "0" &&
  process.env.CLERK_FRONTEND_API_PROXY !== "false";

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) {
      return;
    }
    await auth.protect();
  },
  {
    ...(useClerkFrontendApiProxy
      ? {
          /**
           * Proxies `/__clerk/*` to Clerk’s Frontend API. Clerk validates `Clerk-Proxy-Url`
           * against Dashboard → Domains; mismatch yields `host_invalid` (see .env.example).
           */
          frontendApiProxy: { enabled: true },
        }
      : {}),
  },
);

export const config = {
  matcher: [
    /*
     * Run Clerk proxy on every route EXCEPT:
     *  - _next internals & static assets (default Next.js convention)
     *  - /embed/* paths — these load inside cross-origin iframes where
     *    Clerk's dev-browser handshake fails (third-party cookies blocked
     *    on real mobile devices), causing a blank iframe.
     */
    "/((?!_next|embed/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

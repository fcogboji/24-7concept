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

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: [
    /*
     * Run Clerk middleware on every route EXCEPT:
     *  - _next internals & static assets (default Next.js convention)
     *  - /embed/* paths — these load inside cross-origin iframes where
     *    Clerk's dev-browser handshake fails (third-party cookies blocked
     *    on real mobile devices), causing a blank iframe.
     */
    "/((?!_next|embed/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getConfiguredAppOrigin, preferWwwAppOrigin } from "@/lib/app-origin";

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
  // Static asset but named .json, so it isn't caught by the matcher's `js(?!on)`
  // extension exclusion below — must be listed explicitly or Clerk redirects it to /login.
  "/manifest.json",
  // Never send Frontend API / handshake traffic through auth.protect — that turns
  // cookie minting into a login redirect (session-token-and-uat-missing loop).
  "/__clerk(.*)",
  // All embed routes (widget-js, chat, future paths) must stay public for third-party iframes/scripts.
  "/embed(.*)",
  "/api/chat(.*)",
  "/api/bots/(.*)/suggestions",
  "/api/leads(.*)",
  "/api/health(.*)",
  "/api/session(.*)",
  "/api/embed(.*)",
  // Payment webhooks are server-to-server: they carry no Clerk session and must bypass
  // auth. Both verify their provider signature before trusting anything in the body.
  "/api/stripe/webhook(.*)",
  "/api/paystack/webhook(.*)",
  // Scheduled jobs carry no Clerk session either; they authenticate with CRON_SECRET.
  "/api/cron(.*)",
  "/admin/sign-in(.*)",
  "/admin/unauthorized(.*)",
]);

/**
 * Same-origin `/__clerk` proxy is opt-in only. Default off so production with a Clerk
 * custom domain (e.g. clerk.faztino.com) talks to Clerk directly — enabling the proxy
 * without Dashboard proxy URL setup causes `host_invalid` on www.faztino.com.
 * Set CLERK_FRONTEND_API_PROXY=1 only if you configured the proxy in Clerk Dashboard.
 */
const useClerkFrontendApiProxy =
  process.env.CLERK_FRONTEND_API_PROXY === "1" ||
  process.env.CLERK_FRONTEND_API_PROXY === "true";

function authorizedParties(): string[] {
  const parties = new Set<string>([
    "https://www.faztino.com",
    "https://faztino.com",
    getConfiguredAppOrigin(),
  ]);
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    parties.add(`https://${vercelUrl.replace(/^https?:\/\//i, "")}`);
  }
  return [...parties].filter(Boolean);
}

function requestAppOrigin(req: { headers: Headers; nextUrl: URL }): string {
  const proto =
    (req.headers.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() ||
    req.nextUrl.protocol.replace(":", "") ||
    "https";
  const host =
    (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
      .split(",")[0]
      ?.trim() || req.nextUrl.host;
  return preferWwwAppOrigin(`${proto}://${host}`);
}

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) {
      return;
    }
    const dest = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    await auth.protect({
      // Absolute URL on the browser's real host (not an internal Vercel URL).
      unauthenticatedUrl: `${requestAppOrigin(req)}/login?redirect_url=${encodeURIComponent(dest)}`,
    });
  },
  {
    signInUrl: "/login",
    signUpUrl: "/register",
    authorizedParties: authorizedParties(),
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

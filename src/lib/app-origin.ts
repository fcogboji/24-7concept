/**
 * Canonical production origin. Apex and www must not be mixed — Clerk `__session`
 * cookies are host-scoped, so login on one host and dashboard on the other looks signed-out.
 */
const CANONICAL_PROD_ORIGIN = "https://www.faztino.com";

/** Prefer www when the configured/request host is our apex (matches next.config redirect). */
export function preferWwwAppOrigin(origin: string): string {
  try {
    const u = new URL(origin);
    if (u.hostname.toLowerCase() === "faztino.com") {
      u.hostname = "www.faztino.com";
      return u.origin;
    }
  } catch {
    /* ignore */
  }
  return origin.replace(/\/$/, "");
}

/**
 * Sync origin for middleware / edge (no `headers()`). Never returns apex for production.
 */
export function getConfiguredAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (raw && !/localhost|127\.0\.0\.1/i.test(raw)) {
    return preferWwwAppOrigin(raw);
  }
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    const host = vercelProd.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    return preferWwwAppOrigin(`https://${host}`);
  }
  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_PROD_ORIGIN;
  }
  return raw || "http://localhost:3000";
}

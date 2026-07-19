/**
 * Only allow same-app paths; avoids open redirects from untrusted callback / Clerk
 * `redirect_url` query params. Treats apex and www as the same site.
 */
function hostKey(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function safeAppRedirectPath(
  callbackUrl: string | undefined,
  appOrigin: string,
  fallback = "/dashboard",
): string {
  if (!callbackUrl?.trim()) return fallback;

  const raw = callbackUrl.trim();

  // Relative path only (Clerk sometimes sends path-only values)
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    if (raw.includes("://") || raw.toLowerCase().startsWith("/\\")) return fallback;
    return raw;
  }

  try {
    const u = new URL(raw);
    const app = new URL(appOrigin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    if (hostKey(u.hostname) !== hostKey(app.hostname)) return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}

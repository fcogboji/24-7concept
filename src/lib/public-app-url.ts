import { headers } from "next/headers";

/**
 * Base URL derived from this HTTP request (browser `Origin`, then forwarded Host).
 * Used so Stripe return URLs land on the same deployment the user started checkout from.
 */
function appBaseFromThisRequest(h: Headers): string | null {
  const origin = h.get("origin")?.trim();
  if (origin && /^https?:\/\/.+/i.test(origin)) {
    try {
      const u = new URL(origin);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return `${u.protocol}//${u.host}`.replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
  }

  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = hostRaw.split(",")[0]?.trim();
  if (!host) return null;

  const protoHeader = (h.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
  const proto =
    protoHeader ||
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${proto}://${host}`.replace(/\/$/, "");
}

/**
 * Stripe Checkout success/cancel URLs and Billing Portal `return_url`.
 * Prefers the deployment the user is actually on (request Origin/Host) so a stale
 * `NEXT_PUBLIC_APP_URL` does not send them to an old Vercel URL or domain.
 */
export async function getAppUrlForStripeRedirects(): Promise<string> {
  const h = await headers();
  const fromRequest = appBaseFromThisRequest(h);
  if (fromRequest) {
    return fromRequest;
  }

  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return raw || "http://localhost:3000";
}

/**
 * Public origin for embeds, Open Graph, etc.
 *
 * - Uses `NEXT_PUBLIC_APP_URL` when it is set and not localhost (explicit production config).
 * - Otherwise uses the current request origin (fixes missing/wrong env on Vercel).
 * - Falls back to localhost only when nothing else applies.
 *
 * For Stripe return URLs, use {@link getAppUrlForStripeRedirects} instead.
 */
export async function getPublicAppUrl(): Promise<string> {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = hostRaw.split(",")[0]?.trim() || null;
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  const fromRequest = host ? `${proto}://${host}` : null;

  const envIsProduction = Boolean(raw && !raw.includes("localhost"));
  if (envIsProduction && fromRequest) {
    try {
      const envHost = new URL(raw!).host;
      const requestHost = new URL(fromRequest).host;
      // Prefer the host this request actually used when env is stale/mismatched.
      if (envHost !== requestHost && !requestHost.includes("localhost")) {
        return fromRequest;
      }
    } catch {
      // Fall through to env value below.
    }
  }
  if (envIsProduction) {
    return raw!;
  }
  if (fromRequest) {
    return fromRequest;
  }
  return raw || "http://localhost:3000";
}

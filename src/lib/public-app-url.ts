import { headers } from "next/headers";

/**
 * Public origin for embeds, Open Graph, Stripe redirects, etc.
 *
 * - Uses `NEXT_PUBLIC_APP_URL` when it is set and not localhost (explicit production config).
 * - Otherwise uses the current request origin (fixes missing/wrong env on Vercel).
 * - Falls back to localhost only when nothing else applies.
 */
export async function getPublicAppUrl(): Promise<string> {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const h = await headers();
  const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = hostRaw.split(",")[0]?.trim() || null;
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  const fromRequest = host ? `${proto}://${host}` : null;

  const envIsProduction = Boolean(raw && !raw.includes("localhost"));
  if (envIsProduction) {
    return raw!;
  }
  if (fromRequest) {
    return fromRequest;
  }
  return raw || "http://localhost:3000";
}

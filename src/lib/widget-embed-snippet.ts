/**
 * Vercel Deployment Protection blocks anonymous GETs unless the bypass token is present.
 * Server route `GET /embed/widget-js` injects `window.__247CONCEPT_BYPASS` from env so
 * customers do not embed secrets in the script URL.
 *
 * @see https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection
 */
const BYPASS_QUERY_KEY = "x-vercel-protection-bypass";

export function getVercelProtectionBypassSecret(): string | null {
  const auto = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (auto) return auto;
  const manual = process.env.WIDGET_VERCEL_PROTECTION_BYPASS?.trim();
  if (manual) return manual;
  return null;
}

/**
 * Canonical script URL for embeds. Uses `/embed/widget-js` so the response can include
 * a server-injected bypass prelude. `bypassSecret` is kept for callers that still pass
 * it; the URL is clean (no secret in query) when using the dynamic route.
 */
export function widgetScriptUrl(appUrl: string, _bypassSecret?: string | null): string {
  const origin = appUrl.replace(/\/$/, "");
  return `${origin}/embed/widget-js`;
}

/** Legacy: URL with bypass in query (for static `/widget.js` only, no server prelude). */
export function widgetScriptUrlWithBypassQuery(appUrl: string, bypassSecret: string | null): string {
  const origin = appUrl.replace(/\/$/, "");
  const url = `${origin}/widget.js`;
  if (!bypassSecret) return url;
  const q = new URLSearchParams();
  q.set(BYPASS_QUERY_KEY, bypassSecret);
  return `${url}?${q.toString()}`;
}

/** Homepage demo loader: cache-bust; bypass comes from `/embed/widget-js` prelude when env is set. */
export function widgetDemoScriptUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  const u = new URL(`${base}/embed/widget-js`);
  // Avoid `v=clerk` — it confuses debugging and can stick to a stale CDN 404. Bump when changing widget output.
  u.searchParams.set("v", "embed-2");
  return u.toString();
}

/** HTML embed snippet (script tag) for customer sites. */
export function buildWidgetEmbedSnippet(input: {
  appUrl: string;
  botId: string;
  botName: string;
  bypassSecret?: string | null;
}): string {
  const base = input.appUrl.replace(/\/$/, "");
  const src = widgetScriptUrl(base, input.bypassSecret ?? getVercelProtectionBypassSecret());
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<script src="${esc(src)}" defer data-api-base="${esc(base)}" data-bot-id="${esc(input.botId)}" data-brand="${esc(input.botName)}"></script>`;
}

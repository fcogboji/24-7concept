/**
 * Vercel Deployment Protection blocks anonymous GETs to /widget.js unless the request
 * includes the project's bypass token (query or header). Vercel injects
 * VERCEL_AUTOMATION_BYPASS_SECRET when "Protection Bypass for Automation" is enabled.
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

/** Full URL for /widget.js, with optional Vercel protection bypass query. */
export function widgetScriptUrl(appUrl: string, bypassSecret: string | null): string {
  const origin = appUrl.replace(/\/$/, "");
  const url = `${origin}/widget.js`;
  if (!bypassSecret) return url;
  const q = new URLSearchParams();
  q.set(BYPASS_QUERY_KEY, bypassSecret);
  return `${url}?${q.toString()}`;
}

/** Homepage demo loader: cache-bust + same bypass as customer embed. */
export function widgetDemoScriptUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  const u = new URL(`${base}/widget.js`);
  u.searchParams.set("v", "clerk");
  const bypass = getVercelProtectionBypassSecret();
  if (bypass) u.searchParams.set(BYPASS_QUERY_KEY, bypass);
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

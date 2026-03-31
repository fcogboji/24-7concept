/**
 * CORS for public embed widget (`/api/chat`, `/api/leads`).
 * If `WIDGET_ALLOWED_ORIGINS` is unset (default), allows any origin (`*`).
 * If set to a comma-separated list, only those exact `Origin` values may call the API.
 * Use private deployments or single-tenant; multi-tenant embeds normally leave this unset.
 */
export function getWidgetCorsHeaders(req: Request): Record<string, string> | null {
  const list = process.env.WIDGET_ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = req.headers.get("origin");

  if (list && list.length > 0) {
    if (!origin || !list.includes(origin)) {
      return null;
    }
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };
  }

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

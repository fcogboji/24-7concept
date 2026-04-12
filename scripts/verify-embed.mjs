#!/usr/bin/env node
/**
 * Verifies widget asset + CORS preflight for cross-origin embeds.
 * Requires the app running: npm run dev (default http://127.0.0.1:3000)
 *
 * Usage: node scripts/verify-embed.mjs
 *        BASE_URL=http://localhost:3000 node scripts/verify-embed.mjs
 *
 * Manual UI check (third-party origin): create any local HTML that loads
 *   <script src="YOUR_APP_ORIGIN/embed/widget.js" defer data-api-base="YOUR_APP_ORIGIN" data-bot-id="…"></script>
 * and open it via a second static server on another port (e.g. npx serve . -l 8765).
 */

const base = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const foreignOrigin = "http://127.0.0.1:8765";
const bypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ||
  process.env.WIDGET_VERCEL_PROTECTION_BYPASS?.trim() ||
  "";

function widgetJsUrl() {
  const u = new URL(`${base}/widget.js`);
  if (bypass) u.searchParams.set("x-vercel-protection-bypass", bypass);
  return u.toString();
}

async function main() {
  const w = await fetch(widgetJsUrl());
  if (!w.ok) {
    console.error(`FAIL: GET /widget.js → ${w.status}`);
    process.exit(1);
  }
  const js = await w.text();
  if (!js.includes("findEmbedScript") || !js.includes("embed/chat")) {
    console.error("FAIL: widget.js body looks unexpected");
    process.exit(1);
  }
  console.log("OK  GET /widget.js", w.status, `(${js.length} bytes)`);

  const embedPath = new URL(`${base}/embed/widget.js`);
  if (bypass) embedPath.searchParams.set("x-vercel-protection-bypass", bypass);
  const embed = await fetch(embedPath.toString());
  if (!embed.ok) {
    console.error(`FAIL: GET /embed/widget.js → ${embed.status}`);
    process.exit(1);
  }
  const embedBody = await embed.text();
  if (!embedBody.includes("findEmbedScript") || !embedBody.includes("embed/chat")) {
    console.error("FAIL: /embed/widget.js body looks unexpected");
    process.exit(1);
  }
  if (bypass && !embedBody.includes("__NESTBOT_BYPASS")) {
    console.warn("WARN: /embed/widget.js expected prelude __NESTBOT_BYPASS when bypass env is set");
  }
  console.log("OK  GET /embed/widget.js", embed.status, `(${embedBody.length} bytes)`);

  const legacyPath = new URL(`${base}/embed/widget-js`);
  if (bypass) legacyPath.searchParams.set("x-vercel-protection-bypass", bypass);
  const legacy = await fetch(legacyPath.toString());
  if (!legacy.ok) {
    console.error(`FAIL: GET /embed/widget-js (legacy) → ${legacy.status}`);
    process.exit(1);
  }
  console.log("OK  GET /embed/widget-js (legacy)", legacy.status);

  const opt = await fetch(`${base}/api/chat`, {
    method: "OPTIONS",
    headers: {
      Origin: foreignOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  const allow = opt.headers.get("access-control-allow-origin");
  if (opt.status !== 204 || allow !== foreignOrigin) {
    console.error(`FAIL: OPTIONS /api/chat → ${opt.status}, ACAO=${allow} (expected 204 + ${foreignOrigin})`);
    process.exit(1);
  }
  console.log("OK  OPTIONS /api/chat", opt.status, "ACAO=", allow);

  const post = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      Origin: foreignOrigin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ botId: "demo_site_assistant", message: "ping" }),
  });

  const ct = post.headers.get("content-type") || "";
  const postAllow = post.headers.get("access-control-allow-origin");
  if (postAllow !== foreignOrigin && postAllow !== "*") {
    console.warn("WARN: POST ACAO=", postAllow, "(browser may still allow if credentialed=false)");
  }
  console.log("OK  POST /api/chat", post.status, ct.slice(0, 40));
}

main().catch((e) => {
  const refused = e?.cause?.code === "ECONNREFUSED" || e?.code === "ECONNREFUSED";
  if (refused) {
    console.error(
      `Cannot reach ${base} (connection refused).\n` +
        `  • Start the app in another terminal: npm run dev\n` +
        `  • Or check a deployed build: BASE_URL=https://your-app.vercel.app npm run verify:embed`
    );
  } else {
    console.error(e);
  }
  process.exit(1);
});

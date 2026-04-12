/**
 * 24/7concept embed — runs on customer sites with their permission (script tag).
 * Loads the chat UI in an iframe (same-origin to your app) so clicks never navigate the host page.
 * Idempotent per botId: safe if the script runs twice (SPA navigations).
 */
(function () {
  function findEmbedScript() {
    var cs = document.currentScript;
    if (cs && cs.getAttribute("data-bot-id")) return cs;
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      if (!s.getAttribute("data-bot-id")) continue;
      var src = s.src || "";
      if (
        /\/widget\.js(\?|$)/i.test(src) ||
        /\/api\/embed(\?|$)/i.test(src) ||
        /\/embed\/widget\.js(\?|$)/i.test(src) ||
        /\/embed\/widget-js(\?|$)/i.test(src)
      ) {
        return s;
      }
    }
    return null;
  }

  function run() {
    var mount = document.documentElement;
    if (!mount) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run);
      }
      return;
    }

    var script = findEmbedScript();
    if (!script) return;

    var botId = script.getAttribute("data-bot-id");
    if (!botId) return;

    var existingHosts = document.querySelectorAll('[data-nestbot-embed="1"]');
    for (var hi = 0; hi < existingHosts.length; hi++) {
      if (existingHosts[hi].getAttribute("data-bot-id") === botId) return;
    }

    var brand = script.getAttribute("data-brand") || "Support";
    var apiBase = script.getAttribute("data-api-base");
    if (!apiBase) {
      try {
        apiBase = new URL(script.src).origin;
      } catch (e) {
        apiBase = "";
      }
    }
    var base = apiBase.replace(/\/$/, "");

    function protectionBypass() {
      try {
        if (typeof window !== "undefined" && window.__NESTBOT_BYPASS) {
          return String(window.__NESTBOT_BYPASS);
        }
      } catch (e) {}
      try {
        var scriptUrl = new URL(script.src);
        var b = scriptUrl.searchParams.get("x-vercel-protection-bypass");
        if (b) return b;
      } catch (e) {}
      var attr = script.getAttribute("data-vercel-bypass");
      return attr || "";
    }

    var u = new URL(base + "/embed/chat");
    u.searchParams.set("botId", botId);
    u.searchParams.set("brand", brand);
    var bypass = protectionBypass();
    if (bypass) u.searchParams.set("x-vercel-protection-bypass", bypass);

    var iframe = document.createElement("iframe");
    iframe.src = u.toString();
    iframe.title = "Chat";
    iframe.setAttribute("aria-label", "Chat widget");
    /**
     * Prevent iframe content from navigating the top-level customer page.
     * Keep only capabilities needed for Next.js app + form interactions inside widget.
     */
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
    iframe.setAttribute("allowtransparency", "true");
    iframe.allow = "clipboard-read; clipboard-write";

    /**
     * Must use the host page viewport — iframe innerWidth/innerHeight are ~160×56
     * and must never size the iframe.
     *
     * Uses CSS viewport units (min()) so the browser handles orientation changes
     * natively and the iframe does NOT shrink when the mobile virtual keyboard opens
     * (CSS viewport units exclude the keyboard, unlike window.innerHeight on Android).
     * JS px values are set first as a fallback for very old browsers.
     */
    var panelOpen = false;
    function applyIframeSize() {
      if (panelOpen) {
        /* JS fallback (old browsers that lack min()) */
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        iframe.style.width = Math.min(380, Math.floor(vw * 0.96)) + "px";
        iframe.style.height = Math.min(620, Math.floor(vh * 0.88)) + "px";
        /* CSS viewport-unit override — survives keyboard open on mobile */
        iframe.style.width = "min(380px, 96vw)";
        iframe.style.height = "min(620px, 88vh)";
        iframe.style.height = "min(620px, 88dvh)";
      } else {
        iframe.style.width = "220px";
        iframe.style.height = "160px";
      }
    }

    var expectedOrigin = new URL(base).origin;
    window.addEventListener("message", function onMsg(e) {
      if (e.origin !== expectedOrigin) return;
      var d = e.data;
      if (!d || d.type !== "nestbot-size") return;
      if (typeof d.open === "boolean") panelOpen = d.open;
      applyIframeSize();
    });
    window.addEventListener("resize", applyIframeSize);

    /**
     * Shadow DOM isolates the widget from host-site CSS that may hide it on mobile
     * (e.g. `[id*="chat"] { display:none }` or mobile media queries).
     */
    var host = document.createElement("div");
    host.id = "hb-nestbot-host-" + botId.replace(/[^a-zA-Z0-9_-]/g, "_");
    host.setAttribute("data-nestbot-embed", "1");
    host.setAttribute("data-bot-id", botId);
    host.style.cssText =
      "position:fixed !important;bottom:0 !important;right:0 !important;left:auto !important;top:auto !important;z-index:2147483647 !important;margin:0 !important;padding:0 !important;border:0 !important;background:transparent !important;pointer-events:none !important;line-height:0 !important;display:block !important;visibility:visible !important;opacity:1 !important;width:auto !important;height:auto !important;overflow:visible !important;";

    var shadow = host.attachShadow({ mode: "open" });
    var wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;bottom:0;right:0;left:auto;top:auto;z-index:2147483647;margin:0;padding:0;border:0;background:transparent;pointer-events:none;line-height:0;";
    iframe.style.cssText =
      "border:0;border-radius:18px;box-shadow:none;z-index:2147483647;background:transparent;pointer-events:auto;width:220px;height:160px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);display:block;color-scheme:normal;overflow:hidden;";
    iframe.style.bottom = "max(8px, env(safe-area-inset-bottom, 0px))";
    iframe.style.right = "max(0px, env(safe-area-inset-right, 0px))";
    iframe.style.left = "auto";
    iframe.style.top = "auto";
    iframe.style.position = "fixed";
    wrapper.appendChild(iframe);
    shadow.appendChild(wrapper);

    /* Append to body so fixed positioning works reliably on mobile */
    var target = document.body || mount;
    try {
      target.appendChild(host);
    } catch (err) {
      if (document.body) document.body.appendChild(host);
    }
  }

  run();
})();

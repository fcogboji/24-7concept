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

    var existingHosts = document.querySelectorAll('[data-247concept-embed="1"]');
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
        if (typeof window !== "undefined" && window.__247CONCEPT_BYPASS) {
          return String(window.__247CONCEPT_BYPASS);
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
    iframe.allow = "clipboard-read; clipboard-write";
    iframe.style.cssText =
      "position:fixed;border:0;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,0.15);z-index:2147483647;background:transparent;pointer-events:auto;width:160px;height:56px;max-width:calc(100vw - 24px);max-height:calc(100dvh - 48px);";
    iframe.style.bottom = "max(16px, env(safe-area-inset-bottom, 0px))";
    iframe.style.right = "max(16px, env(safe-area-inset-right, 0px))";
    iframe.style.left = "auto";
    iframe.style.top = "auto";

    /** Must use the host page viewport — iframe innerWidth/innerHeight are ~160×56 and must never size the iframe. */
    var panelOpen = false;
    function applyIframeSize() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      if (panelOpen) {
        var w = Math.min(380, Math.floor(vw * 0.96));
        var h = Math.min(620, Math.floor(vh * 0.88));
        iframe.style.width = w + "px";
        iframe.style.height = h + "px";
      } else {
        iframe.style.width = "160px";
        iframe.style.height = "56px";
      }
    }

    var expectedOrigin = new URL(base).origin;
    window.addEventListener("message", function onMsg(e) {
      if (e.origin !== expectedOrigin) return;
      var d = e.data;
      if (!d || d.type !== "247concept-size") return;
      if (typeof d.open === "boolean") panelOpen = d.open;
      applyIframeSize();
    });
    window.addEventListener("resize", applyIframeSize);

    var host = document.createElement("div");
    host.id = "hb-247concept-host-" + botId.replace(/[^a-zA-Z0-9_-]/g, "_");
    host.setAttribute("data-247concept-embed", "1");
    host.setAttribute("data-bot-id", botId);
    host.style.cssText =
      "position:fixed;inset:auto 0 0 auto;z-index:2147483647;margin:0;padding:0;border:0;background:transparent;pointer-events:none;line-height:0;";
    host.appendChild(iframe);

    try {
      mount.appendChild(host);
    } catch (err) {
      if (document.body) document.body.appendChild(host);
    }
  }

  run();
})();

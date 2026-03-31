(function () {
  var script = document.currentScript;
  if (!script) return;

  var botId = script.getAttribute("data-bot-id");
  if (!botId) return;

  var brand = script.getAttribute("data-brand") || "Support";
  var apiBase = script.getAttribute("data-api-base");
  if (!apiBase) {
    try {
      apiBase = new URL(script.src).origin;
    } catch (e) {
      apiBase = "";
    }
  }
  var chatUrl = apiBase.replace(/\/$/, "") + "/api/chat";
  var leadUrl = apiBase.replace(/\/$/, "") + "/api/leads";
  var sessionUrl = apiBase.replace(/\/$/, "") + "/api/session";
  var loginUrl = apiBase.replace(/\/$/, "") + "/login";
  var registerUrl = apiBase.replace(/\/$/, "") + "/register";
  var assistantReplies = 0;
  var leadUiShown = false;

  var style = document.createElement("style");
  style.textContent =
    "#hb-launcher{position:fixed;z-index:2147483000;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;bottom:max(16px,env(safe-area-inset-bottom,0px));right:max(16px,env(safe-area-inset-right,0px));left:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}" +
    "#hb-btn{appearance:none;border:0;cursor:pointer;border-radius:999px;min-height:44px;padding:12px 18px;background:#1c1917;color:#fafaf9;font-size:15px;font-weight:600;letter-spacing:0.01em;box-shadow:0 10px 30px rgba(0,0,0,0.18);transition:transform .15s ease,box-shadow .15s ease;}" +
    "#hb-btn:hover{transform:translateY(-1px);box-shadow:0 14px 36px rgba(0,0,0,0.22);}" +
    "#hb-panel{position:fixed;z-index:2147483000;display:none;flex-direction:column;border-radius:18px;overflow:hidden;background:#fafaf9;border:1px solid #e7e5e4;box-shadow:0 24px 60px rgba(0,0,0,0.15);font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;bottom:calc(72px + env(safe-area-inset-bottom,0px));right:max(12px,env(safe-area-inset-right,0px));left:auto;width:min(380px,calc(100vw - 24px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)));max-height:min(520px,calc(100dvh - 120px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px)));}" +
    "#hb-panel.hb-open{display:flex;}" +
    "#hb-head{padding:14px 16px;background:#1c1917;color:#fafaf9;font-weight:600;font-size:15px;display:flex;align-items:center;justify-content:space-between;gap:8px;}" +
    "#hb-close{appearance:none;border:0;background:transparent;color:#a8a29e;cursor:pointer;font-size:18px;line-height:1;min-width:44px;min-height:44px;padding:12px;border-radius:8px;touch-action:manipulation;}" +
    "#hb-close:hover{color:#fafaf9;background:rgba(255,255,255,0.08);}" +
    "#hb-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#f5f5f4 0%,#fafaf9 40%);}" +
    ".hb-msg{max-width:88%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;}" +
    ".hb-user{align-self:flex-end;background:#1c1917;color:#fafaf9;border-bottom-right-radius:4px;}" +
    ".hb-bot{align-self:flex-start;background:#fff;color:#292524;border:1px solid #e7e5e4;border-bottom-left-radius:4px;}" +
    ".hb-typing{font-size:12px;color:#78716c;padding:4px 2px;align-self:flex-start;}" +
    "#hb-foot{display:flex;gap:8px;align-items:center;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom,0px));border-top:1px solid #e7e5e4;background:#fff;}" +
    "#hb-foot input{flex:1;min-width:0;border:1px solid #d6d3d1;border-radius:12px;padding:10px 12px;font-size:16px;outline:none;background:#fff;color:#1c1917;}" +
    "#hb-foot input:focus{border-color:#a8a29e;box-shadow:0 0 0 3px rgba(120,113,108,0.15);}" +
    "#hb-send{appearance:none;border:0;border-radius:12px;min-height:44px;padding:10px 14px;background:#1c1917;color:#fafaf9;font-weight:600;font-size:14px;cursor:pointer;touch-action:manipulation;}" +
    "#hb-send:disabled{opacity:0.5;cursor:not-allowed;}" +
    ".hb-chip-wrap{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;}" +
    ".hb-chip{appearance:none;border:1px solid #d6d3d1;background:#fff;border-radius:999px;padding:8px 12px;font-size:14px;color:#44403c;cursor:pointer;min-height:40px;touch-action:manipulation;}" +
    ".hb-chip:hover{border-color:#a8a29e;background:#fafaf9;}" +
    ".hb-lead-box{margin-top:10px;padding:12px;border-radius:14px;border:1px dashed #d6d3d1;background:#fff;}" +
    ".hb-lead-hint{font-size:12px;color:#78716c;margin:0 0 8px;line-height:1.4;}" +
    ".hb-lead-row{display:flex;gap:8px;align-items:center;}" +
    ".hb-lead-email{flex:1;min-width:0;border:1px solid #d6d3d1;border-radius:10px;padding:10px 12px;font-size:16px;outline:none;}" +
    ".hb-lead-btn{flex-shrink:0;border:0;border-radius:10px;min-height:44px;padding:8px 14px;background:#44403c;color:#fff;font-size:14px;font-weight:600;cursor:pointer;touch-action:manipulation;}" +
    ".hb-lead-btn:disabled{opacity:0.5;cursor:not-allowed;}" +
    ".hb-lead-note{font-size:12px;margin:8px 0 0;line-height:1.4;}";

  document.head.appendChild(style);

  var root = document.createElement("div");
  root.id = "hb-launcher";

  var btn = document.createElement("button");
  btn.id = "hb-btn";
  btn.type = "button";
  btn.textContent = "Message us";

  var panel = document.createElement("div");
  panel.id = "hb-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat");

  panel.innerHTML =
    '<div id="hb-head"><span id="hb-title"></span><button type="button" id="hb-close" aria-label="Close">×</button></div>' +
    '<div class="hb-chip-wrap" id="hb-chips"></div>' +
    '<div id="hb-msgs"></div>' +
    '<div id="hb-foot"><input id="hb-input" type="text" placeholder="Write a message…" autocomplete="off" /><button type="button" id="hb-send">Send</button></div>';

  root.appendChild(btn);
  document.body.appendChild(root);
  document.body.appendChild(panel);

  var titleEl = panel.querySelector("#hb-title");
  if (titleEl) titleEl.textContent = brand;

  var chips = panel.querySelector("#hb-chips");
  var suggestions = ["How does this work?", "What does it cost?", "How do I install it?"];
  suggestions.forEach(function (label) {
    var c = document.createElement("button");
    c.type = "button";
    c.className = "hb-chip";
    c.textContent = label;
    c.addEventListener("click", function () {
      input.value = label;
      send();
    });
    chips.appendChild(c);
  });

  var msgs = panel.querySelector("#hb-msgs");
  var input = panel.querySelector("#hb-input");
  var sendBtn = panel.querySelector("#hb-send");
  var closeBtn = panel.querySelector("#hb-close");

  var opened = false;
  function openPanel() {
    panel.classList.add("hb-open");
    opened = true;
    if (!msgs.querySelector(".hb-msg")) {
      addBot("Hi — ask us anything about this page, or try a suggestion below.");
    }
    setTimeout(function () {
      input.focus();
    }, 50);
  }

  function requireAuthOrRedirect() {
    return fetch(sessionUrl, {
      credentials: "include",
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (session) {
        if (session && session.user && session.user.id) {
          return true;
        }
        var callbackUrl = encodeURIComponent(window.location.href);
        // Default to login, with an option to switch via data-auth-mode="register"
        var mode = script.getAttribute("data-auth-mode");
        if (mode === "register") {
          window.location.href = registerUrl + "?callbackUrl=" + callbackUrl;
        } else {
          window.location.href = loginUrl + "?callbackUrl=" + callbackUrl;
        }
        return false;
      })
      .catch(function () {
        var callbackUrl = encodeURIComponent(window.location.href);
        window.location.href = loginUrl + "?callbackUrl=" + callbackUrl;
        return false;
      });
  }

  function toggle() {
    requireAuthOrRedirect().then(function (ok) {
      if (!ok) return;
      if (panel.classList.contains("hb-open")) {
        panel.classList.remove("hb-open");
        opened = false;
      } else {
        openPanel();
      }
    });
  }

  btn.addEventListener("click", toggle);
  closeBtn.addEventListener("click", function () {
    panel.classList.remove("hb-open");
    opened = false;
  });

  function addUser(text) {
    var d = document.createElement("div");
    d.className = "hb-msg hb-user";
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addBot(text) {
    var d = document.createElement("div");
    d.className = "hb-msg hb-bot";
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function setTyping(on) {
    var el = document.getElementById("hb-typing");
    if (on) {
      if (!el) {
        el = document.createElement("div");
        el.id = "hb-typing";
        el.className = "hb-typing";
        el.textContent = "Typing…";
        msgs.appendChild(el);
      }
    } else if (el) {
      el.remove();
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function insertLeadBox() {
    if (leadUiShown) return;
    leadUiShown = true;
    var wrap = document.createElement("div");
    wrap.className = "hb-lead-box";
    wrap.innerHTML =
      '<p class="hb-lead-hint">Want someone to follow up by email?</p>' +
      '<div class="hb-lead-row">' +
      '<input type="email" class="hb-lead-email" placeholder="you@company.com" autocomplete="email" />' +
      '<button type="button" class="hb-lead-btn">Send</button>' +
      "</div>" +
      '<p class="hb-lead-note" style="display:none"></p>';
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    var emailInput = wrap.querySelector(".hb-lead-email");
    var leadBtn = wrap.querySelector(".hb-lead-btn");
    var note = wrap.querySelector(".hb-lead-note");
    function submitLead() {
      var em = (emailInput.value || "").trim();
      if (!em) return;
      leadBtn.disabled = true;
      fetch(leadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: botId, email: em }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (j) {
          if (j.ok) {
            note.textContent = "Thanks — we will be in touch.";
            note.style.color = "#15803d";
            note.style.display = "block";
            emailInput.style.display = "none";
            leadBtn.style.display = "none";
          } else {
            note.textContent = j.error || "Could not save.";
            note.style.color = "#b91c1c";
            note.style.display = "block";
            leadBtn.disabled = false;
          }
        })
        .catch(function () {
          note.textContent = "Something went wrong.";
          note.style.color = "#b91c1c";
          note.style.display = "block";
          leadBtn.disabled = false;
        });
    }
    leadBtn.addEventListener("click", submitLead);
    emailInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitLead();
      }
    });
  }

  function send() {
    var text = (input.value || "").trim();
    if (!text) return;

    addUser(text);
    input.value = "";
    sendBtn.disabled = true;
    setTyping(true);

    fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: botId, message: text }),
    })
      .then(function (res) {
        var ct = res.headers.get("content-type") || "";
        if (ct.indexOf("application/json") !== -1) {
          return res.json().then(function (j) {
            setTyping(false);
            addBot(j.error || "Something went wrong.");
          });
        }
        if (!res.ok || !res.body) {
          setTyping(false);
          addBot("We could not reach the assistant. Try again in a moment.");
          return;
        }
        var botMsg = addBot("");
        botMsg.classList.add("hb-bot");
        setTyping(false);

        var reader = res.body.getReader();
        var dec = new TextDecoder();
        function read() {
          return reader.read().then(function (chunk) {
            if (chunk.done) {
              assistantReplies++;
              if (assistantReplies >= 2) insertLeadBox();
              sendBtn.disabled = false;
              return;
            }
            botMsg.textContent += dec.decode(chunk.value, { stream: true });
            msgs.scrollTop = msgs.scrollHeight;
            return read();
          });
        }
        return read();
      })
      .catch(function () {
        setTyping(false);
        addBot("Connection problem. Please try again.");
      })
      .finally(function () {
        sendBtn.disabled = false;
      });
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();

"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const SIZE_MSG = "247concept-size";

const DEFAULT_SUGGESTIONS = ["What do you do?", "How can I contact you?", "What are your hours?"];

function fetchWithNetworkRetry(url: string, init?: RequestInit): Promise<Response> {
  const merged: RequestInit = { mode: "cors", credentials: "omit", cache: "no-store", ...init };
  return fetch(url, merged).catch(() =>
    new Promise<Response>((resolve, reject) => {
      setTimeout(() => {
        fetch(url, merged).then(resolve).catch(reject);
      }, 650);
    })
  );
}

function EmbedChatInner() {
  const sp = useSearchParams();
  const botId = (sp.get("botId") || "").trim();
  const brand = (sp.get("brand") || "Support").trim() || "Support";

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [assistantReplies, setAssistantReplies] = useState(0);
  const [leadDone, setLeadDone] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNote, setLeadNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [origin, setOrigin] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (!botId || !origin) return;
    fetch(`${origin}/api/bots/${botId}/suggestions`, {
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j: { suggestions?: string[] }) => {
        if (Array.isArray(j.suggestions) && j.suggestions.length > 0) {
          setSuggestions(j.suggestions.slice(0, 3));
        }
      })
      .catch(() => {});
  }, [botId, origin]);

  /** Parent script sizes the iframe from the host viewport. Here we only signal open/closed — iframe inner dimensions are ~160×56 and must not be used for layout math. */
  const postSize = useCallback(() => {
    if (typeof window === "undefined") return;
    window.parent.postMessage({ type: SIZE_MSG, open }, "*");
  }, [open]);

  useEffect(() => {
    postSize();
  }, [postSize]);

  useEffect(() => {
    const onResize = () => postSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [postSize]);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const chatUrl = origin ? `${origin}/api/chat` : "";
  const leadUrl = origin ? `${origin}/api/leads` : "";

  const submitLead = useCallback(() => {
    const em = leadEmail.trim();
    if (!em || !botId || !leadUrl) return;
    setLeadSubmitting(true);
    fetchWithNetworkRetry(leadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId, email: em }),
    })
      .then((r) => r.json())
      .then((j: { ok?: boolean; error?: string }) => {
        if (j.ok) {
          setLeadNote({ text: "Thanks — we will be in touch.", ok: true });
          setLeadDone(true);
        } else {
          setLeadNote({ text: j.error || "Could not save.", ok: false });
        }
      })
      .catch(() => setLeadNote({ text: "Something went wrong.", ok: false }))
      .finally(() => setLeadSubmitting(false));
  }, [botId, leadEmail, leadUrl]);

  const sendMessage = useCallback(
    (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || !botId || !chatUrl) return;

      setInput("");

      setMsgs((prev) => [...prev, { role: "user", text }, { role: "bot", text: "" }]);
      setTyping(true);

      fetchWithNetworkRetry(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, message: text }),
      })
        .then((res) => {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            return res.json().then((j: { error?: string }) => {
              setTyping(false);
              setMsgs((prev) => {
                const copy = [...prev];
                if (copy.length) copy[copy.length - 1] = { role: "bot", text: j.error || "Something went wrong." };
                return copy;
              });
            });
          }
          if (!res.ok || !res.body) {
            setTyping(false);
            setMsgs((prev) => {
              const copy = [...prev];
              if (copy.length)
                copy[copy.length - 1] = {
                  role: "bot",
                  text: "We could not reach the assistant. Try again in a moment.",
                };
              return copy;
            });
            return;
          }
          setTyping(false);
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          function read(): Promise<void> {
            return reader.read().then((chunk) => {
              if (chunk.done) {
                setAssistantReplies((n) => n + 1);
                return;
              }
              const piece = dec.decode(chunk.value, { stream: true });
              setMsgs((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "bot") {
                  copy[copy.length - 1] = { role: "bot", text: last.text + piece };
                }
                return copy;
              });
              return read();
            });
          }
          return read();
        })
        .catch(() => {
          setTyping(false);
          setMsgs((prev) => {
            const copy = [...prev];
            if (copy.length)
              copy[copy.length - 1] = { role: "bot", text: "Connection problem. Please try again." };
            return copy;
          });
        });
    },
    [botId, chatUrl, input]
  );

  if (!botId) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-600">
        Missing bot configuration (botId).
      </div>
    );
  }

  const showLeadBox = assistantReplies >= 2 && !leadDone;
  const brandInitial = brand.trim().charAt(0).toUpperCase() || "S";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent font-sans text-stone-900">
      {!open && (
        <div className="flex h-full w-full min-h-[56px] items-end justify-end p-2">
          <button
            type="button"
            className="flex h-[56px] w-[56px] items-center justify-center cursor-pointer rounded-full border-0 bg-red-500 text-xl leading-none text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-px hover:shadow-[0_14px_36px_rgba(0,0,0,0.22)] hover:bg-red-600"
            aria-label="Open chat"
            onClick={() => {
              setOpen(true);
              setMsgs((prev) =>
                prev.length === 0
                  ? [{ role: "bot", text: `\u{1F44B} Hi there! Welcome to ${brand}. How can I help you today?` }]
                  : prev
              );
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      )}

      {open && (
        <div className="flex h-full min-h-0 flex-col">
          <div className="mx-2 mb-2 flex min-h-0 max-h-[min(520px,calc(100%-72px))] flex-1 flex-col overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 rounded-t-[18px] bg-stone-800 px-4 py-3.5 text-white">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                  {brandInitial}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold">{brand}</div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-300">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    Online · Typically replies instantly
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={msgsRef}
              className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-stone-50/50 px-4 py-4"
            >
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[88%] whitespace-pre-wrap break-words rounded-[14px] rounded-br-sm bg-red-500 px-[13px] py-2.5 text-sm leading-snug text-white"
                        : "max-w-[88%] whitespace-pre-wrap break-words rounded-[14px] rounded-bl-sm border border-stone-200 bg-white px-[13px] py-2.5 text-sm leading-snug text-stone-800"
                    }
                  >
                    {m.text}
                  </div>
                  {i === 0 && m.role === "bot" && (
                    <div className="mt-1 text-[11px] text-stone-400">{formatTime(new Date())}</div>
                  )}
                </div>
              ))}
              {typing && <div className="self-start text-xs text-stone-400">Typing…</div>}

              {/* Suggestion chips */}
              {msgs.length <= 1 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="min-h-9 cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[13px] text-stone-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => sendMessage(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {showLeadBox && (
                <div className="mt-2.5 rounded-[14px] border border-dashed border-stone-300 bg-white p-3">
                  <p className="mb-2 text-xs leading-snug text-stone-500">Want someone to follow up by email?</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      className="min-w-0 flex-1 rounded-[10px] border border-stone-300 px-3 py-2.5 text-base outline-none"
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitLead();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={leadSubmitting}
                      className="shrink-0 cursor-pointer rounded-[10px] border-0 bg-red-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                      onClick={submitLead}
                    >
                      Send
                    </button>
                  </div>
                  {leadNote && !leadNote.ok && (
                    <p className="mt-2 text-xs text-red-700">{leadNote.text}</p>
                  )}
                </div>
              )}
              {leadDone && leadNote?.ok && (
                <p className="text-xs text-green-700">{leadNote.text}</p>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-stone-200 bg-white px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
              <div className="flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-xl border border-red-200 px-3.5 py-2.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                  type="text"
                  placeholder="Ask anything..."
                  autoComplete="off"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center cursor-pointer rounded-xl border-0 bg-red-500 text-white hover:bg-red-600 transition-colors"
                  aria-label="Send message"
                  onClick={() => sendMessage()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
              <div className="mt-2 text-center text-[11px] text-stone-400">
                Powered by <span className="font-medium text-stone-500">247concept</span> <span className="text-red-400">&#10022;</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="flex shrink-0 justify-end px-2 pb-2">
            <button
              type="button"
              className="flex h-[52px] w-[52px] items-center justify-center cursor-pointer rounded-full border-0 bg-red-500 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:bg-red-600 transition-colors"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmbedChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[56px] items-center justify-center p-4 text-sm text-stone-500">Loading…</div>
      }
    >
      <EmbedChatInner />
    </Suspense>
  );
}

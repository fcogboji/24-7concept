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

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent font-sans text-stone-900">
      {!open && (
        <div className="flex h-full w-full min-h-[56px] items-end justify-end p-2">
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer rounded-full border-0 bg-stone-900 px-3 py-3 text-xl leading-none text-stone-50 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-px hover:shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
            aria-label="Open chat"
            onClick={() => {
              setOpen(true);
              setMsgs((prev) =>
                prev.length === 0
                  ? [{ role: "bot", text: `Hi there. Welcome to ${brand}. How can I help today?` }]
                  : prev
              );
            }}
          >
            &#128172;
          </button>
        </div>
      )}

      {open && (
        <div className="flex h-full min-h-0 flex-col">
          <div className="mx-2 mb-2 flex min-h-0 max-h-[min(520px,calc(100%-72px))] flex-1 flex-col overflow-hidden rounded-[18px] border border-stone-200 bg-stone-50 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between gap-2 bg-stone-900 px-4 py-3.5 text-stone-50">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-700 text-sm font-bold text-stone-100">
                  {brandInitial}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold">{brand}</div>
                  <div className="text-[11px] text-stone-300">Online - typically replies instantly</div>
                </div>
              </div>
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] cursor-pointer rounded-lg border-0 bg-transparent p-3 text-lg leading-none text-stone-400 hover:bg-white/10 hover:text-stone-50"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-4 pb-2.5 pt-0">
              {suggestions.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="min-h-10 cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                  onClick={() => sendMessage(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              ref={msgsRef}
              className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-gradient-to-b from-stone-100 to-stone-50 px-4 py-3.5"
            >
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "max-w-[88%] self-end whitespace-pre-wrap break-words rounded-[14px] rounded-br-sm border-0 bg-stone-900 px-[13px] py-2.5 text-sm leading-snug text-stone-50"
                      : "max-w-[88%] self-start whitespace-pre-wrap break-words rounded-[14px] rounded-bl-sm border border-stone-200 bg-white px-[13px] py-2.5 text-sm leading-snug text-stone-800"
                  }
                >
                  {m.text}
                </div>
              ))}
              {typing && <div className="self-start text-xs text-stone-500">Typing…</div>}
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
                      className="shrink-0 cursor-pointer rounded-[10px] border-0 bg-stone-700 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
            <div className="flex items-center gap-2 border-t border-stone-200 bg-white px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
              <input
                className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-base text-stone-900 outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.15)]"
                type="text"
                placeholder={`Message ${brand}…`}
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
                className="min-h-11 shrink-0 cursor-pointer rounded-xl border-0 bg-stone-900 px-3.5 py-2.5 text-sm font-semibold text-stone-50"
                onClick={() => sendMessage()}
              >
                Send
              </button>
            </div>
          </div>
          <div className="flex shrink-0 justify-end px-2 pb-2">
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer rounded-full border-0 bg-stone-900 px-3 py-3 text-xl leading-none text-stone-50 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
              aria-label="Toggle chat"
              onClick={() => setOpen((o) => !o)}
            >
              &#128172;
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bot = {
  id: string;
  name: string;
  websiteUrl: string | null;
  businessInfo: string | null;
  sources: number;
  messages: number;
};

export function BotKnowledgePanel({ bot }: { bot: Bot }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "success" | "error">("neutral");
  const [training, setTraining] = useState(false);
  const [urlDraft, setUrlDraft] = useState(bot.websiteUrl ?? "");
  const [businessInfoDraft, setBusinessInfoDraft] = useState(bot.businessInfo ?? "");
  const [savingUrl, setSavingUrl] = useState(false);
  const [savingBusinessInfo, setSavingBusinessInfo] = useState(false);
  const [businessInfoSaved, setBusinessInfoSaved] = useState(false);
  const [autoLearning, setAutoLearning] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [trainingFromText, setTrainingFromText] = useState(false);
  const BUSINESS_INFO_MAX = 12000;
  const PASTE_TEXT_MAX = 100_000;

  async function saveUrl() {
    setSavingUrl(true);
    setStatus(null);
    setStatusTone("neutral");
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: urlDraft.trim() === "" ? null : urlDraft.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus(data.error ?? "Could not save URL");
        setStatusTone("error");
        return;
      }
      setStatus("Saved URL.");
      setStatusTone("success");
      router.refresh();
    } finally {
      setSavingUrl(false);
    }
  }

  async function saveBusinessInfo() {
    setSavingBusinessInfo(true);
    setStatus(null);
    setStatusTone("neutral");
    setBusinessInfoSaved(false);
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessInfo: businessInfoDraft.trim() === "" ? null : businessInfoDraft.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus(data.error ?? "Could not save business information");
        setStatusTone("error");
        return;
      }
      setStatus("Saved business information.");
      setStatusTone("success");
      setBusinessInfoSaved(true);
      setTimeout(() => setBusinessInfoSaved(false), 2500);
      router.refresh();
    } finally {
      setSavingBusinessInfo(false);
    }
  }

  async function autoLearn() {
    const u = urlDraft.trim();
    if (!u && !bot.websiteUrl) {
      setStatus("Add a website URL first.");
      setStatusTone("error");
      return;
    }
    setAutoLearning(true);
    setStatus(null);
    setStatusTone("neutral");
    try {
      // Save URL first if changed
      if (u && u !== (bot.websiteUrl ?? "")) {
        const patch = await fetch(`/api/bots/${bot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl: u }),
        });
        if (!patch.ok) {
          const data = (await patch.json()) as { error?: string };
          setStatus(data.error ?? "Could not save URL");
          setStatusTone("error");
          return;
        }
        router.refresh();
      }

      const res = await fetch(`/api/bots/${bot.id}/auto-learn`, { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        businessInfo?: string;
        error?: string;
        crawl?: { pagesVisited: number; pagesWithUsableText: number; totalChars: number };
      };

      if (!res.ok) {
        const parts = [data.error ?? "Auto-learn failed"];
        if (data.crawl) {
          parts.push(
            `(${data.crawl.pagesVisited} pages visited, ${data.crawl.pagesWithUsableText} had text, ${data.crawl.totalChars} chars)`
          );
        }
        setStatus(parts.join(" "));
        setStatusTone("error");
        return;
      }

      if (data.businessInfo) {
        setBusinessInfoDraft(data.businessInfo);
        setStatus("Business info extracted from your website — review it below, then click Save.");
        setStatusTone("success");
      }
    } finally {
      setAutoLearning(false);
    }
  }

  async function train() {
    const u = urlDraft.trim();
    if (!u && !bot.websiteUrl) {
      setStatus("Add a website URL first.");
      setStatusTone("error");
      return;
    }
    setTraining(true);
    setStatus(null);
    setStatusTone("neutral");
    try {
      if (u && u !== (bot.websiteUrl ?? "")) {
        const patch = await fetch(`/api/bots/${bot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl: u }),
        });
        if (!patch.ok) {
          const data = (await patch.json()) as { error?: string };
          setStatus(data.error ?? "Could not save URL");
          setStatusTone("error");
          return;
        }
        router.refresh();
      }

      const res = await fetch(`/api/bots/${bot.id}/train`, { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        chunks?: number;
        error?: string;
        hint?: string;
        crawl?: {
          pagesVisited: number;
          pagesWithUsableText: number;
          totalChars: number;
          fetchFailures: number;
          usedPlaywright?: boolean;
          staticCrawlChars?: number;
        };
      };
      if (!res.ok) {
        const parts = [data.error ?? "Training failed", data.hint].filter(Boolean);
        if (data.crawl) {
          const c = data.crawl;
          const mode =
            c.usedPlaywright === true
              ? `headless browser was used (static pass had ${c.staticCrawlChars ?? 0} chars).`
              : "static HTML fetch only.";
          parts.push(
            `Details: ${c.pagesVisited} page(s) opened, ${c.pagesWithUsableText} had enough text, ${c.totalChars} characters total, ${c.fetchFailures} failed fetches — ${mode}`
          );
        }
        setStatus(parts.join(" "));
        setStatusTone("error");
        return;
      }
      setStatus(`Indexed ${data.chunks ?? 0} text chunks.`);
      setStatusTone("success");
      router.refresh();
    } finally {
      setTraining(false);
    }
  }

  async function trainFromText() {
    const t = pastedText.trim();
    if (t.length < 24) {
      setStatus("Please paste at least a few sentences of content to train on.");
      setStatusTone("error");
      return;
    }
    setTrainingFromText(true);
    setStatus(null);
    setStatusTone("neutral");
    try {
      const res = await fetch(`/api/bots/${bot.id}/train-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        chunks?: number;
        error?: string;
      };
      if (!res.ok) {
        setStatus(data.error ?? "Training from pasted text failed");
        setStatusTone("error");
        return;
      }
      setStatus(`Indexed ${data.chunks ?? 0} text chunks from pasted content.`);
      setStatusTone("success");
      setPastedText("");
      router.refresh();
    } finally {
      setTrainingFromText(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Website source</h2>
        <p className="mt-2 text-sm text-gray-600">
          We crawl public pages on this domain when you run training. Text is chunked and embedded for retrieval.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {bot.sources} indexed chunks · {bot.messages} messages stored
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://your-site.com"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-base text-gray-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
          />
          <button
            type="button"
            onClick={saveUrl}
            disabled={savingUrl}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            {savingUrl ? "Saving…" : "Save URL"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Business information</h2>
        <p className="mt-2 text-sm text-gray-600">
          Add hours, services, pricing hints, location, contact details, and FAQs. The assistant uses this context in chat replies.
        </p>
        <button
          type="button"
          onClick={autoLearn}
          disabled={autoLearning || training}
          className="mt-3 rounded-full border border-[#0d9488]/30 bg-teal-50 px-4 py-2 text-sm font-semibold text-[#0d9488] hover:bg-teal-100 disabled:opacity-60"
        >
          {autoLearning ? "Reading your website…" : "Auto-fill from website"}
        </button>
        {autoLearning && (
          <p className="mt-2 text-xs text-gray-500">
            Crawling your site and extracting business details. This may take up to a minute.
          </p>
        )}
        <textarea
          value={businessInfoDraft}
          onChange={(e) => setBusinessInfoDraft(e.target.value)}
          rows={10}
          placeholder="Business name, opening hours, what you do, contact details, FAQs..."
          className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">Tip: include hours, pricing, location, contact details, and FAQs.</span>
          <span
            className={
              businessInfoDraft.length > BUSINESS_INFO_MAX
                ? "font-medium text-red-600"
                : businessInfoDraft.length > BUSINESS_INFO_MAX * 0.9
                  ? "font-medium text-amber-600"
                  : "text-gray-400"
            }
          >
            {businessInfoDraft.length}/{BUSINESS_INFO_MAX}
          </span>
        </div>
        <button
          type="button"
          onClick={saveBusinessInfo}
          disabled={savingBusinessInfo || businessInfoDraft.length > BUSINESS_INFO_MAX}
          className="mt-4 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
        >
          {savingBusinessInfo ? "Saving…" : "Save business info"}
        </button>
        {businessInfoSaved && (
          <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Saved successfully
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Train from website</h2>
        <p className="mt-2 text-sm text-gray-600">
          Run training to refresh indexed content from your site. Use a URL whose page has real text in the HTML (homepage,
          About, Contact, or docs). JavaScript-only shells with an empty initial HTML body often train poorly.
        </p>
        <button
          type="button"
          onClick={train}
          disabled={training}
          className="mt-4 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f7669] disabled:opacity-60"
        >
          {training ? "Training…" : "Run training"}
        </button>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Train from pasted text</h2>
        <p className="mt-2 text-sm text-gray-600">
          If your site is behind authentication (e.g. Clerk) or blocks crawlers, paste your page content here instead.
          Copy text from your site and paste it below — we&apos;ll index it the same way.
        </p>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          rows={8}
          placeholder="Paste your website content here — FAQs, service descriptions, about page text, etc."
          className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">Paste content from pages the crawler cannot reach.</span>
          <span
            className={
              pastedText.length > PASTE_TEXT_MAX
                ? "font-medium text-red-600"
                : pastedText.length > PASTE_TEXT_MAX * 0.9
                  ? "font-medium text-amber-600"
                  : "text-gray-400"
            }
          >
            {pastedText.length > 0 ? `${pastedText.length.toLocaleString()}/${PASTE_TEXT_MAX.toLocaleString()}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={trainFromText}
          disabled={trainingFromText || training || pastedText.trim().length < 24 || pastedText.length > PASTE_TEXT_MAX}
          className="mt-4 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f7669] disabled:opacity-60"
        >
          {trainingFromText ? "Training..." : "Train from pasted text"}
        </button>
      </section>

      {status && (
        <p
          className={
            statusTone === "error"
              ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              : statusTone === "success"
                ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                : "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
          }
        >
          {status}
        </p>
      )}
    </div>
  );
}

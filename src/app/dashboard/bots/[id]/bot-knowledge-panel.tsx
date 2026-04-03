"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bot = {
  id: string;
  name: string;
  websiteUrl: string | null;
  sources: number;
  messages: number;
};

export function BotKnowledgePanel({ bot }: { bot: Bot }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [urlDraft, setUrlDraft] = useState(bot.websiteUrl ?? "");
  const [savingUrl, setSavingUrl] = useState(false);

  async function saveUrl() {
    setSavingUrl(true);
    setStatus(null);
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
        return;
      }
      setStatus("Saved URL.");
      router.refresh();
    } finally {
      setSavingUrl(false);
    }
  }

  async function train() {
    const u = urlDraft.trim();
    if (!u && !bot.websiteUrl) {
      setStatus("Add a website URL first.");
      return;
    }
    setTraining(true);
    setStatus(null);
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
        };
      };
      if (!res.ok) {
        const parts = [data.error ?? "Training failed", data.hint].filter(Boolean);
        if (data.crawl) {
          parts.push(
            `Details: ${data.crawl.pagesVisited} page(s) opened, ${data.crawl.pagesWithUsableText} had enough text, ${data.crawl.totalChars} characters total, ${data.crawl.fetchFailures} failed fetches.`
          );
        }
        setStatus(parts.join(" "));
        return;
      }
      setStatus(`Indexed ${data.chunks ?? 0} text chunks.`);
      router.refresh();
    } finally {
      setTraining(false);
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

      {status && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{status}</p>
      )}
    </div>
  );
}

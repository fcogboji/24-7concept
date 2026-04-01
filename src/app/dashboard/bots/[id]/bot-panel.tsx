"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bot = {
  id: string;
  name: string;
  websiteUrl: string | null;
  sources: number;
  messages: number;
  isDemo: boolean;
};

export function BotPanel({ bot, appUrl }: { bot: Bot; appUrl: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [urlDraft, setUrlDraft] = useState(bot.websiteUrl ?? "");
  const [savingUrl, setSavingUrl] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const snippet = `<script src="${appUrl}/widget.js" async data-bot-id="${bot.id}" data-brand="${escapeAttr(bot.name)}"></script>`;

  function escapeAttr(s: string) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setStatus("Copied to clipboard.");
    setTimeout(() => setStatus(null), 2500);
  }

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

  async function deleteAssistant() {
    if (bot.isDemo) return;
    if (
      !window.confirm(
        `Delete “${bot.name}”? This removes training data, messages, and leads for this assistant. The embed snippet will stop working.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/bots/${bot.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus(data.error ?? "Could not delete assistant");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
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
      };
      if (!res.ok) {
        const msg = [data.error ?? "Training failed", data.hint].filter(Boolean).join(" ");
        setStatus(msg);
        return;
      }
      setStatus(`Indexed ${data.chunks ?? 0} text chunks.`);
      router.refresh();
    } finally {
      setTraining(false);
    }
  }

  return (
    <div className="mt-4">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-stone-900">
        {bot.name}
      </h1>
      <p className="mt-1 text-stone-600">
        {bot.websiteUrl ?? "No website URL yet"} · {bot.sources} chunks · {bot.messages} messages
        stored
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Website source
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            We only fetch public pages on this domain when you run training.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://your-site.com"
              className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
            <button
              type="button"
              onClick={saveUrl}
              disabled={savingUrl}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60"
            >
              {savingUrl ? "Saving…" : "Save URL"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Install
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Paste before the closing <code className="rounded bg-stone-100 px-1">&lt;/body&gt;</code>{" "}
            tag, or in your theme&apos;s custom HTML section.
          </p>
          <pre className="mt-4 max-h-[min(40vh,320px)] overflow-auto rounded-xl bg-stone-900 p-3 text-[11px] leading-relaxed text-stone-100 sm:p-4 sm:text-xs">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={copy}
            className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Copy snippet
          </button>
        </section>

        {!bot.isDemo && (
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-800">
              Danger zone
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Remove this assistant if you no longer need it (for example to free a slot on the free plan). This cannot
              be undone.
            </p>
            <button
              type="button"
              onClick={deleteAssistant}
              disabled={deleting}
              className="mt-4 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete assistant"}
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Train from website
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            We crawl a handful of pages on the same domain, split the text, and match visitor
            questions to the closest passages.
          </p>
          <button
            type="button"
            onClick={train}
            disabled={training}
            className="mt-4 rounded-full border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60"
          >
            {training ? "Training…" : "Run training"}
          </button>
        </section>

        {status && (
          <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

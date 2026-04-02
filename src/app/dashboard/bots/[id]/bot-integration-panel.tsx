"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bot = {
  id: string;
  name: string;
  isDemo: boolean;
};

export function BotIntegrationPanel({ bot, appUrl }: { bot: Bot; appUrl: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Integration</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Active
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Copy and paste this code snippet right before the closing <code className="rounded bg-gray-100 px-1">&lt;/body&gt;</code> tag on your website, or in your theme&apos;s custom HTML section.
        </p>
        <div className="relative mt-4">
          <pre className="max-h-[min(40vh,320px)] overflow-auto rounded-xl bg-gray-900 p-4 text-[11px] leading-relaxed text-gray-100 sm:text-xs">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={copy}
            className="absolute right-3 top-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20"
          >
            Copy
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Need help? Check our guides. Works with WordPress, Shopify, and most static site hosts.
        </p>
      </section>

      {!bot.isDemo && (
        <section className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-red-800">Danger zone</h2>
          <p className="mt-2 text-sm text-gray-600">
            Remove this assistant if you no longer need it. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={deleteAssistant}
            disabled={deleting}
            className="mt-4 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete assistant"}
          </button>
        </section>
      )}

      {status && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{status}</p>
      )}
    </div>
  );
}

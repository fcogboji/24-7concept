"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Hook {
  id: string;
  url: string;
  label: string | null;
  events: string;
  active: boolean;
}

export function WebhookManager({ initial }: { initial: Hook[] }) {
  const router = useRouter();
  const [hooks, setHooks] = useState<Hook[]>(initial);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks-config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, label: label || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to add webhook");
      }
      const { hook } = await res.json();
      setHooks([hook, ...hooks]);
      setUrl("");
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this webhook?")) return;
    const res = await fetch(`/api/webhooks-config/${id}`, { method: "DELETE" });
    if (res.ok) {
      setHooks(hooks.filter((h) => h.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Your endpoints</h2>

      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.zapier.com/..."
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f7669] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add webhook"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 divide-y divide-gray-100">
        {hooks.length === 0 && <li className="py-6 text-sm text-gray-500">No webhooks yet.</li>}
        {hooks.map((h) => (
          <li key={h.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{h.label || h.url}</p>
              <p className="truncate text-xs text-gray-500">{h.url}</p>
              <p className="mt-0.5 text-xs text-gray-400">Events: {h.events}</p>
            </div>
            <button
              onClick={() => remove(h.id)}
              className="shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

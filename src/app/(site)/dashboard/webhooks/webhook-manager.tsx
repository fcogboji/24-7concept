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
  const [newSecret, setNewSecret] = useState<string | null>(null);

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
      const { hook, secret } = await res.json();
      setHooks([hook, ...hooks]);
      setNewSecret(secret ?? null);
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

      {newSecret && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Save this signing secret now — it won&apos;t be shown again.</p>
          <p className="mt-1 text-xs text-amber-800">
            Each request will include header <code className="rounded bg-amber-100 px-1 py-0.5">x-faztino-signature: sha256=&lt;hex&gt;</code>{" "}
            computed as HMAC-SHA256 of the raw body using this secret. Verify it on your endpoint to confirm the request came from faztino.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-xs text-gray-900">{newSecret}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(newSecret)}
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setNewSecret(null)}
              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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

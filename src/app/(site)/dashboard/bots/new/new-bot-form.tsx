"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewBotForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          websiteUrl: websiteUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { bot?: { id: string }; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create");
        return;
      }
      if (data.bot?.id) {
        router.push(`/dashboard/bots/${data.bot.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          Display name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          placeholder="e.g. Riley Street Cafe"
        />
      </div>
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-stone-700">
          Website URL (optional for now)
        </label>
        <input
          id="url"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          placeholder="https://"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create assistant"}
      </button>
    </form>
  );
}

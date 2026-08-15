"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Status = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

export function DemoVideoForm({
  initialUrl,
  initialLabel,
}: {
  initialUrl: string;
  initialLabel: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [label, setLabel] = useState(initialLabel);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function save(nextUrl: string) {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoVideoUrl: nextUrl, demoVideoLabel: label }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "Could not save. Try again." });
        return;
      }
      setStatus({
        kind: "saved",
        message: nextUrl ? "Saved — the video is live on the landing page." : "Video removed from the landing page.",
      });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Network error. Try again." });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(url.trim());
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <label htmlFor="demo-video-url" className="block text-sm font-medium text-stone-900">
        Video URL
      </label>
      <p className="mt-1 text-xs text-stone-500">
        Paste a YouTube, Vimeo, or Loom share link. Example:{" "}
        <code className="rounded bg-stone-100 px-1">https://www.youtube.com/watch?v=…</code>
      </p>
      <input
        id="demo-video-url"
        type="url"
        inputMode="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
        className="mt-3 min-h-11 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
      />

      <label htmlFor="demo-video-label" className="mt-5 block text-sm font-medium text-stone-900">
        Badge text <span className="font-normal text-stone-500">(optional)</span>
      </label>
      <input
        id="demo-video-label"
        type="text"
        maxLength={120}
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Faztino product demo"
        className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3 text-sm text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status.kind === "saving"}
          className="inline-flex min-h-11 items-center rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {status.kind === "saving" ? "Saving…" : "Save"}
        </button>
        {initialUrl && (
          <button
            type="button"
            disabled={status.kind === "saving"}
            onClick={() => {
              setUrl("");
              void save("");
            }}
            className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
          >
            Remove video
          </button>
        )}
        {status.message && (
          <span
            className={`text-sm ${status.kind === "error" ? "text-red-700" : "text-teal-800"}`}
            role="status"
          >
            {status.message}
          </span>
        )}
      </div>
    </form>
  );
}

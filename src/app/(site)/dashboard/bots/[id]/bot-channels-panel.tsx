"use client";

import { useState } from "react";

export function BotChannelsPanel({
  botId,
  initialWhatsapp,
}: {
  botId: string;
  initialWhatsapp: string | null;
}) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: whatsapp.trim() || null }),
      });
      const data = (await res.json()) as { error?: string; bot?: { whatsappNumber?: string | null } };
      if (!res.ok) throw new Error(data.error || "Could not save");
      setWhatsapp(data.bot?.whatsappNumber ?? "");
      setSaved("Saved. WhatsApp is live on the widget.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Widget contact options</h2>
      <p className="mt-1 text-sm text-gray-600">
        The chat bubble opens a menu: Live chat, WhatsApp, and Contact us (call). Live chat captures leads, books
        appointments, and passes conversations to your team when needed.
      </p>

      <ul className="mt-4 space-y-2 text-sm text-gray-600">
        <li>
          <span className="font-medium text-gray-900">Live chat</span> — always on. Visitors chat with your business;
          your team takes over from the dashboard when a handoff happens.
        </li>
        <li>
          <span className="font-medium text-gray-900">WhatsApp</span> — opens your WhatsApp number in a new tab.
        </li>
        <li>
          <span className="font-medium text-gray-900">Contact us</span> — visitors tap to call your inbound number. The
          AI receptionist answers immediately. Turn on Phone answering and assign a number first.
        </li>
      </ul>

      <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="wa-number">
        WhatsApp business number
      </label>
      <input
        id="wa-number"
        type="tel"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder="+15551234567"
        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 shadow-sm focus:border-[#1C7C4A] focus:outline-none focus:ring-2 focus:ring-[#1C7C4A]/20"
      />
      <p className="mt-1.5 text-xs text-gray-500">International format. Leave blank to hide a working WhatsApp button.</p>

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="mt-4 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save WhatsApp number"}
      </button>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="mt-3 text-sm text-emerald-700">{saved}</p>}
    </section>
  );
}

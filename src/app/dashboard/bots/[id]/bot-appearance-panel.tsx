"use client";

import { useState } from "react";

export function BotAppearancePanel({ botName }: { botName: string }) {
  const [name, setName] = useState(botName);
  const [welcome, setWelcome] = useState("Hi there! How can I help you today?");
  const [primary, setPrimary] = useState("teal");
  const [saved, setSaved] = useState<string | null>(null);

  const swatches = [
    { id: "teal", class: "bg-[#0d9488] ring-2 ring-offset-2 ring-[#0d9488]" },
    { id: "blue", class: "bg-blue-600" },
    { id: "purple", class: "bg-violet-600" },
    { id: "pink", class: "bg-pink-500" },
    { id: "slate", class: "bg-slate-700" },
  ];

  function save() {
    setSaved("Saved locally for preview — widget theming from the dashboard is coming soon.");
    setTimeout(() => setSaved(null), 4000);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Widget appearance</h2>
        <p className="mt-1 text-sm text-gray-600">How the chat bubble and panel look on your site.</p>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Primary color</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {swatches.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPrimary(s.id)}
                className={`h-10 w-10 rounded-full ${s.class} ${primary === s.id ? "ring-2 ring-offset-2 ring-gray-400" : "opacity-90 hover:opacity-100"}`}
                aria-label={s.id}
              />
            ))}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-lg text-gray-400">
              +
            </span>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="bot-name">
            Bot name
          </label>
          <input
            id="bot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full max-w-md rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
          />
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="welcome">
            Welcome message
          </label>
          <textarea
            id="welcome"
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
            rows={3}
            className="mt-2 w-full max-w-lg rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/25"
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="mt-6 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Save changes
        </button>

        {saved && <p className="mt-4 text-sm text-gray-600">{saved}</p>}
      </section>

      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-6 text-center text-sm text-gray-500">
        <p className="font-medium text-gray-700">Preview</p>
        <p className="mt-1">The live widget uses your assistant name from settings. Full theme sync is on the roadmap.</p>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";

type Feature = "phone" | "whatsapp";

export function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [features, setFeatures] = useState<Feature[]>(["phone", "whatsapp"]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggle(feature: Feature) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );
    setStatus("idle");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (features.length === 0) {
      setStatus("error");
      setMessage("Select Phone, WhatsApp, or both.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, features, companyWebsite: "" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not join early access.");

      setStatus("saved");
      setMessage("You're on the early-access list. We'll contact you before launch.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not join early access.");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-2xl">
      <fieldset>
        <legend className="sr-only">Select early-access features</legend>
        <div className="flex flex-wrap justify-center gap-2">
          {(
            [
              ["phone", "AI phone answering"],
              ["whatsapp", "Inbound WhatsApp AI"],
            ] as const
          ).map(([feature, label]) => {
            const selected = features.includes(feature);
            return (
              <button
                key={feature}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggle(feature)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-emerald-200 bg-white text-emerald-900 hover:border-emerald-400"
                }`}
              >
                {selected ? "✓ " : ""}
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="early-access-email">
          Work email
        </label>
        <input
          id="early-access-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@business.com"
          className="min-h-12 flex-1 rounded-full border border-emerald-200 bg-white px-5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
        <button
          type="submit"
          disabled={status === "saving" || status === "saved"}
          className="min-h-12 rounded-full bg-emerald-800 px-6 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Joining…" : status === "saved" ? "Joined" : "Join early access"}
        </button>
      </div>

      <p
        className={`mt-3 min-h-5 text-center text-xs ${
          status === "error" ? "text-red-700" : "text-emerald-900/70"
        }`}
        role="status"
      >
        {message || "No launch date promised. Early-access members help shape pricing and rollout."}
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Checkout unavailable. Configure Stripe for production.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-teal-300 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Redirecting…" : "Upgrade to Pro"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600 sm:text-left">{error}</p>}
    </div>
  );
}

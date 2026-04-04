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
      let data = {} as { url?: string; error?: string; code?: string; detail?: string };
      try {
        data = await res.json();
      } catch {
        setError(`Checkout failed (HTTP ${res.status}). Try again or contact support.`);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      const msg =
        data.error ??
        (res.status === 503
          ? "Billing env vars are missing on this deployment. In Vercel: set STRIPE_SECRET_KEY and STRIPE_PRICE_PRO for Production, then redeploy."
          : "Checkout unavailable.");
      setError(process.env.NODE_ENV === "development" && data.detail ? `${msg} (${data.detail})` : msg);
    } catch {
      setError("Network error. Check your connection and try again.");
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

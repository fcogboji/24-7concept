"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/pricing";

const LABEL: Record<PlanId, string> = {
  starter: "Upgrade to Starter",
  pro: "Upgrade to Pro",
};

const ENV_HINT: Record<PlanId, string> = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
};

export function CheckoutButton({ plan = "pro" }: { plan?: PlanId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
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
          ? `Billing env vars are missing on this deployment. In Vercel: set STRIPE_SECRET_KEY and ${ENV_HINT[plan]} for Production, then redeploy.`
          : "Checkout unavailable.");
      setError(process.env.NODE_ENV === "development" && data.detail ? `${msg} (${data.detail})` : msg);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isPro = plan === "pro";
  const className = isPro
    ? "inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f7669] disabled:opacity-60 sm:w-auto"
    : "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-teal-300 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60 sm:w-auto";

  return (
    <div className="w-full sm:w-auto">
      <button type="button" onClick={go} disabled={loading} className={className}>
        {loading ? "Redirecting…" : LABEL[plan]}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600 sm:text-left">{error}</p>}
    </div>
  );
}

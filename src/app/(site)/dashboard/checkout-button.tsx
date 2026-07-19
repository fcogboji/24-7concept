"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/pricing";
import { BTN_BRAND, BTN_BRAND_OUTLINE } from "@/components/brand-logo";

const LABEL: Record<PlanId, string> = {
  starter: "Upgrade to Starter",
  pro: "Upgrade to Pro",
};

const ENV_HINT: Record<PlanId, string> = {
  starter: "STRIPE_PRICE_STARTER (or STRIPE_PRICE_STARTER_MONTHLY)",
  pro: "STRIPE_PRICE_PRO (or STRIPE_PRICE_PRO_MONTHLY)",
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
    ? `inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto ${BTN_BRAND}`
    : `inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60 sm:w-auto ${BTN_BRAND_OUTLINE}`;

  return (
    <div className="w-full sm:w-auto">
      <button type="button" onClick={go} disabled={loading} className={className}>
        {loading ? "Redirecting…" : LABEL[plan]}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600 sm:text-left">{error}</p>}
    </div>
  );
}

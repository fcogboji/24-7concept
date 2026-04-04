"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncPlanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/sync-billing", { method: "POST" });
      const data = (await res.json()) as { synced?: boolean; error?: string };
      if (data.synced) {
        setMessage("Plan updated — refreshing…");
        router.refresh();
        return;
      }
      setMessage(
        data.error ??
          "No active Pro subscription found for this account email in Stripe. Use the same email you used at checkout, or open Manage billing from a deployment where checkout completed."
      );
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={sync}
        disabled={loading}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Checking Stripe…" : "Refresh plan from Stripe"}
      </button>
      {message && <p className="mt-2 text-center text-xs text-gray-600 sm:text-left">{message}</p>}
    </div>
  );
}

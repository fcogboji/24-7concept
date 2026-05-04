"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Closes the race between Stripe's redirect and the Stripe webhook. When the
 * user lands on /dashboard?session_id=… (or ?checkout=success) but the wall
 * still rendered because the webhook hasn't flipped the DB row yet, this
 * component pings /api/stripe/sync-billing once and refreshes the page on
 * success — so the wall disappears without the user touching anything.
 */
export function SubscriptionWallAutoSync() {
  const router = useRouter();
  const params = useSearchParams();
  const fired = useRef(false);
  const [status, setStatus] = useState<"idle" | "syncing" | "failed">("idle");

  useEffect(() => {
    if (fired.current) return;
    const justCheckedOut =
      params.get("session_id") || params.get("checkout") === "success";
    if (!justCheckedOut) return;
    fired.current = true;
    setStatus("syncing");

    (async () => {
      try {
        const res = await fetch("/api/stripe/sync-billing", { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { synced?: boolean };
        if (data.synced) {
          router.refresh();
          return;
        }
        setStatus("failed");
      } catch {
        setStatus("failed");
      }
    })();
  }, [params, router]);

  if (status === "idle") return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
    >
      {status === "syncing"
        ? "Confirming your payment with Stripe…"
        : "We couldn't auto-confirm your payment. Tap “Refresh plan from Stripe” below."}
    </p>
  );
}

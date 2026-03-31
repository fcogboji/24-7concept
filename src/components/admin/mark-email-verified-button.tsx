"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkEmailVerifiedButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!confirm("Mark this email as verified? Use only when you have confirmed ownership out of band.")) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-email`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Email not verified</p>
      <p className="mt-1 text-xs text-amber-900/90">
        The user cannot sign in until they verify. You can mark verified after manual identity checks.
      </p>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-3 rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-950 disabled:opacity-60"
      >
        {loading ? "Updating…" : "Mark email verified"}
      </button>
    </div>
  );
}

"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const AVATAR_STYLES = [
  "bg-teal-200 text-teal-900",
  "bg-indigo-200 text-indigo-900",
  "bg-amber-200 text-amber-900",
  "bg-rose-200 text-rose-900",
  "bg-cyan-200 text-cyan-900",
  "bg-lime-200 text-lime-900",
];

function hashText(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function UserMenu({
  identity,
  initial,
  canManageBilling,
}: {
  identity: string;
  initial: string;
  canManageBilling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();

  const avatarStyle = useMemo(
    () => AVATAR_STYLES[hashText(identity) % AVATAR_STYLES.length],
    [identity]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function openBilling() {
    setBillingError(null);
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setBillingError(data.error ?? "Could not open billing portal.");
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-stone-100"
      >
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${avatarStyle}`}
        >
          {initial}
        </span>
        <span className="hidden max-w-[180px] truncate text-xs text-stone-500 sm:inline md:text-sm">
          {identity}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-xs text-stone-500">{identity}</p>
          <Link
            href="/dashboard/account"
            className="mt-1 block rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
            onClick={() => setOpen(false)}
          >
            Account & security
          </Link>
          {canManageBilling && (
            <button
              type="button"
              onClick={openBilling}
              disabled={billingLoading}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {billingLoading ? "Opening billing..." : "Manage billing"}
            </button>
          )}
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
          >
            Log out
          </button>
          {billingError && <p className="mt-1 px-2 text-xs text-red-600">{billingError}</p>}
        </div>
      )}
    </div>
  );
}

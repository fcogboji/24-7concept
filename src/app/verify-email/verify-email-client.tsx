"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Missing verification link. Request a new one from the login page.");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    async function run() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Could not verify email.");
        return;
      }
      setStatus("ok");
      setMessage("Your email is verified. You can sign in.");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">24/7concept</p>
      <h1 className="mt-4 text-lg text-stone-700">Email verification</h1>
      {status === "loading" && <p className="mt-6 text-sm text-stone-600">Confirming your email…</p>}
      {status === "ok" && (
        <p className="mt-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</p>
      )}
      {status === "err" && message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{message}</p>
      )}
      <p className="mt-8 text-sm">
        <Link href="/login" className="font-medium text-teal-800 underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

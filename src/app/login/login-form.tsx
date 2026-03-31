"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResendMsg(null);
    setShowResend(false);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        if (res.code === "email_not_verified") {
          setError("Verify your email before signing in. Check your inbox or resend the link below.");
          setShowResend(true);
          return;
        }
        setError("Those details do not match our records.");
        return;
      }
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendMsg(null);
    setResendLoading(true);
    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) {
        setResendMsg(data.error ?? "Could not send email.");
        return;
      }
      setResendMsg("If this account is unverified, we sent a new link.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-medium text-teal-800 underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {showResend && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-700">
          <button
            type="button"
            onClick={resendVerification}
            disabled={resendLoading || !email}
            className="font-medium text-teal-800 underline disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
          {resendMsg && <p className="mt-2 text-xs text-stone-600">{resendMsg}</p>}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Continue"}
      </button>
    </form>
  );
}

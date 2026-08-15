"use client";

import { useState } from "react";
import { BTN_BRAND, BTN_BRAND_OUTLINE } from "@/components/brand-logo";

export type PhoneConfigInitial = {
  enabled: boolean;
  greeting: string | null;
  voice: string | null;
  forwardingNumber: string | null;
  businessHoursOnly: boolean;
  e164Number: string | null;
  vapiAssistantId: string | null;
  vapiPhoneNumberId: string | null;
} | null;

export function PhoneConfigPanel({
  botId,
  initial,
  bookingEnabled,
  platformReady,
}: {
  botId: string;
  initial: PhoneConfigInitial;
  bookingEnabled: boolean;
  platformReady: boolean;
}) {
  const [enabled, setEnabled] = useState(Boolean(initial?.enabled));
  const [greeting, setGreeting] = useState(initial?.greeting ?? "");
  const [voice, setVoice] = useState(initial?.voice ?? "");
  const [forwardingNumber, setForwardingNumber] = useState(initial?.forwardingNumber ?? "");
  const [businessHoursOnly, setBusinessHoursOnly] = useState(Boolean(initial?.businessHoursOnly));
  const [e164Number, setE164Number] = useState(initial?.e164Number ?? "");
  const [areaCode, setAreaCode] = useState("415");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/bots/${botId}/phone`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        config?: {
          enabled: boolean;
          greeting: string | null;
          voice: string | null;
          forwardingNumber: string | null;
          businessHoursOnly: boolean;
          e164Number: string | null;
        };
      };
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.config) {
        setEnabled(data.config.enabled);
        setGreeting(data.config.greeting ?? "");
        setVoice(data.config.voice ?? "");
        setForwardingNumber(data.config.forwardingNumber ?? "");
        setBusinessHoursOnly(data.config.businessHoursOnly);
        setE164Number(data.config.e164Number ?? "");
      }
      setMessage("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = !platformReady
    ? "Needs platform setup"
    : enabled && e164Number
      ? "Live"
      : enabled
        ? "Needs number"
        : "Disabled";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Status</p>
            <p className="mt-1 text-sm text-gray-600">{statusLabel}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusLabel === "Live"
                ? "bg-emerald-50 text-emerald-800"
                : statusLabel === "Disabled"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-amber-50 text-amber-800"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        {!platformReady && (
          <p className="mt-3 text-sm text-amber-800">
            Add <code className="rounded bg-amber-100 px-1">VAPI_API_KEY</code> and Twilio credentials on the
            server to go live.
          </p>
        )}
        {!bookingEnabled && (
          <p className="mt-3 text-sm text-gray-600">
            Booking is off for this assistant — calls can still answer FAQs and capture leads. Enable Booking to
            let the AI schedule appointments on the phone.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-900">Enable phone answering</span>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300"
            checked={enabled}
            disabled={busy}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Greeting</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={3}
            value={greeting}
            disabled={busy}
            placeholder="Hi, thanks for calling… How can I help?"
            onChange={(e) => setGreeting(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Voice ID (optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={voice}
            disabled={busy}
            placeholder="jennifer-playht"
            onChange={(e) => setVoice(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Forward to human (optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={forwardingNumber}
            disabled={busy}
            placeholder="+15551234567"
            onChange={(e) => setForwardingNumber(e.target.value)}
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">Business hours only</span>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300"
            checked={businessHoursOnly}
            disabled={busy}
            onChange={(e) => setBusinessHoursOnly(e.target.checked)}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={busy}
            className={`${BTN_BRAND} rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60`}
            onClick={() =>
              void save({
                enabled,
                greeting: greeting || null,
                voice: voice || null,
                forwardingNumber: forwardingNumber || null,
                businessHoursOnly,
                action: enabled ? "sync" : "disable",
              })
            }
          >
            {busy ? "Saving…" : "Save settings"}
          </button>
          <button
            type="button"
            disabled={busy || !platformReady}
            className={`${BTN_BRAND_OUTLINE} rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60`}
            onClick={() =>
              void save({
                enabled: true,
                greeting: greeting || null,
                voice: voice || null,
                forwardingNumber: forwardingNumber || null,
                businessHoursOnly,
                action: "assign_number",
                areaCode,
              })
            }
          >
            {e164Number ? "Refresh / re-attach number" : "Get phone number"}
          </button>
          {e164Number ? (
            <button
              type="button"
              disabled={busy}
              className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              onClick={() => {
                if (confirm("Release this number and turn phone answering off?")) {
                  void save({ action: "release" });
                }
              }}
            >
              Release number
            </button>
          ) : null}
        </div>

        {!e164Number && (
          <label className="block max-w-[8rem]">
            <span className="text-sm font-medium text-gray-700">Area code</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={areaCode}
              disabled={busy}
              maxLength={3}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
          </label>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </div>

      {e164Number && (
        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-5">
          <p className="text-sm font-semibold text-teal-900">Your AI phone number</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-teal-950">{e164Number}</p>
          <p className="mt-2 text-sm text-teal-900/80">
            Call this number to test. The assistant uses your knowledge base, captures leads, and can book
            appointments when Booking is enabled.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-teal-800 underline"
            onClick={() => void navigator.clipboard.writeText(e164Number)}
          >
            Copy number
          </button>
        </div>
      )}
    </div>
  );
}

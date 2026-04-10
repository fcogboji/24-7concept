"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
];

interface WeeklyHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BlockedDateRow {
  id: string;
  date: Date | string;
  reason: string | null;
}

interface BookingConfig {
  id: string;
  enabled: boolean;
  timezone: string;
  slotDurationMin: number;
  bufferMin: number;
  maxAdvanceDays: number;
  weeklyHours: WeeklyHour[];
  blockedDates: BlockedDateRow[];
}

export function BookingConfigPanel({
  botId,
  initial,
}: {
  botId: string;
  initial: BookingConfig | null;
}) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [timezone, setTimezone] = useState(initial?.timezone ?? "America/New_York");
  const [slotDuration, setSlotDuration] = useState(initial?.slotDurationMin ?? 30);
  const [buffer, setBuffer] = useState(initial?.bufferMin ?? 0);
  const [maxDays, setMaxDays] = useState(initial?.maxAdvanceDays ?? 30);
  const [hours, setHours] = useState<WeeklyHour[]>(
    initial?.weeklyHours ?? [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
    ]
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDateRow[]>(initial?.blockedDates ?? []);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/bots/${botId}/booking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          timezone,
          slotDurationMin: slotDuration,
          bufferMin: buffer,
          maxAdvanceDays: maxDays,
          weeklyHours: hours,
        }),
      });
      if (res.ok) {
        setStatus({ text: "Booking settings saved.", ok: true });
      } else {
        const j = await res.json().catch(() => ({}));
        setStatus({ text: (j as { error?: string }).error || "Failed to save.", ok: false });
      }
    } catch {
      setStatus({ text: "Network error.", ok: false });
    } finally {
      setSaving(false);
    }
  }, [botId, enabled, timezone, slotDuration, buffer, maxDays, hours]);

  const addHour = (day: number) => {
    setHours((prev) => [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeHour = (idx: number) => {
    setHours((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateHour = (idx: number, field: "startTime" | "endTime", value: string) => {
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h)));
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) return;
    try {
      const res = await fetch(`/api/bots/${botId}/booking/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newBlockedDate, reason: newBlockedReason || undefined }),
      });
      if (res.ok) {
        const j = (await res.json()) as { blockedDate: BlockedDateRow };
        setBlockedDates((prev) => [...prev, j.blockedDate]);
        setNewBlockedDate("");
        setNewBlockedReason("");
      }
    } catch { /* ignore */ }
  };

  const removeBlockedDate = async (dateId: string) => {
    try {
      await fetch(`/api/bots/${botId}/booking/blocked-dates/${dateId}`, { method: "DELETE" });
      setBlockedDates((prev) => prev.filter((d) => d.id !== dateId));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8">
      {/* Enable toggle */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Enable Booking</h3>
            <p className="mt-1 text-sm text-gray-500">
              When enabled, your AI assistant can check availability and book appointments for visitors.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
              enabled ? "bg-[#0d9488]" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${
                enabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* General settings */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">General Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
            <input
              type="number"
              min={5}
              max={480}
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Between Appointments (min)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={buffer}
              onChange={(e) => setBuffer(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Advance Booking (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={maxDays}
              onChange={(e) => setMaxDays(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
        </div>
      </section>

      {/* Weekly hours */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Weekly Hours</h3>
        <div className="space-y-3">
          {DAYS.map((dayName, dayIdx) => {
            const dayHours = hours
              .map((h, origIdx) => ({ ...h, origIdx }))
              .filter((h) => h.dayOfWeek === dayIdx);
            return (
              <div key={dayIdx} className="flex flex-wrap items-start gap-2">
                <span className="w-24 shrink-0 pt-2.5 text-sm font-medium text-gray-700">{dayName}</span>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {dayHours.map((h) => (
                    <div key={h.origIdx} className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={h.startTime}
                        onChange={(e) => updateHour(h.origIdx, "startTime", e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      />
                      <span className="text-gray-400">–</span>
                      <input
                        type="time"
                        value={h.endTime}
                        onChange={(e) => updateHour(h.origIdx, "endTime", e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeHour(h.origIdx)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addHour(dayIdx)}
                    className="rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs text-gray-500 hover:border-[#0d9488] hover:text-[#0d9488]"
                  >
                    + Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Blocked dates */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Blocked Dates</h3>
        <p className="mb-3 text-sm text-gray-500">Block specific dates (holidays, vacations) when no appointments can be booked.</p>
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={newBlockedReason}
              onChange={(e) => setNewBlockedReason(e.target.value)}
              placeholder="e.g. Holiday"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
          >
            Add
          </button>
        </div>
        {blockedDates.length > 0 && (
          <div className="space-y-1">
            {blockedDates.map((bd) => (
              <div key={bd.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-800">
                  {typeof bd.date === "string" ? bd.date.slice(0, 10) : new Date(bd.date).toISOString().slice(0, 10)}
                </span>
                {bd.reason && <span className="text-gray-500">— {bd.reason}</span>}
                <button
                  type="button"
                  onClick={() => removeBlockedDate(bd.id)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services link */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Services</h3>
            <p className="mt-1 text-sm text-gray-500">Define the appointment types your business offers.</p>
          </div>
          <Link
            href={`/dashboard/bots/${botId}/booking/services`}
            className="rounded-full bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b7f6f] transition-colors"
          >
            Manage Services
          </Link>
        </div>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#0d9488] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0b7f6f] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? "text-green-700" : "text-red-700"}`}>
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}

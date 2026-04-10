"use client";

import { useCallback, useState } from "react";

interface AppointmentRow {
  id: string;
  botId: string;
  botName: string;
  name: string;
  email: string;
  phone: string | null;
  serviceName: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-gray-100 text-gray-600",
};

export function AppointmentsList({ appointments: initial }: { appointments: AppointmentRow[] }) {
  const [appointments, setAppointments] = useState(initial);
  const [filter, setFilter] = useState<string>("all");

  const updateStatus = useCallback(async (appt: AppointmentRow, newStatus: string) => {
    const res = await fetch(`/api/bots/${appt.botId}/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: newStatus } : a))
      );
    }
  }, []);

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  const formatDateTime = (iso: string, tz: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleString();
    }
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5">
        {["all", "confirmed", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === s
                ? "bg-[#0d9488] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">No appointments yet.</p>
          <p className="mt-1 text-xs text-gray-400">Appointments booked through your AI assistant will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => (
            <div
              key={appt.id}
              className="rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{appt.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[appt.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                    <span>{formatDateTime(appt.startTime, appt.timezone)}</span>
                    {appt.serviceName && <span>{appt.serviceName}</span>}
                    <span>{appt.botName}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-400">
                    <a href={`mailto:${appt.email}`} className="hover:text-gray-600">{appt.email}</a>
                    {appt.phone && <span>{appt.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {appt.status === "confirmed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(appt, "completed")}
                        className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(appt, "cancelled")}
                        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

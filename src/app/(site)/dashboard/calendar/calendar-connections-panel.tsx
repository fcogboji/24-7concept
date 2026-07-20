"use client";

import { useState } from "react";

interface CalendarConnection {
  id: string;
  provider: string;
  email: string;
  calendarId: string | null;
  calendarName: string | null;
  createdAt: string;
}

interface Props {
  connections: CalendarConnection[];
}

export function CalendarConnectionsPanel({ connections: initialConnections }: Props) {
  const [connections, setConnections] = useState(initialConnections);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const handleConnectGoogle = () => {
    window.location.href = "/api/calendar/google/connect";
  };

  const handleConnectMicrosoft = () => {
    window.location.href = "/api/calendar/microsoft/connect";
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this calendar?")) return;

    setDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/calendar/${connectionId}/disconnect`, {
        method: "POST",
      });

      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      } else {
        alert("Failed to disconnect calendar");
      }
    } catch {
      alert("Failed to disconnect calendar");
    } finally {
      setDisconnecting(null);
    }
  };

  const hasGoogle = connections.some((c) => c.provider === "google");
  const hasMicrosoft = connections.some((c) => c.provider === "microsoft");

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Connected Calendars */}
      {connections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">Connected Calendars</h3>
          <div className="space-y-4">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    {conn.provider === "google" ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#0078D4"
                          d="M11.5 0L0 2.025v8.55c0 5.325 3.675 10.35 11.5 13.425 7.825-3.075 11.5-8.1 11.5-13.425v-8.55L11.5 0zm0 2.775L20.25 4.5v6.075c0 4.575-3.075 8.775-8.75 11.475-5.675-2.7-8.75-6.9-8.75-11.475V4.5l8.75-1.725z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{conn.email}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {conn.provider} Calendar
                      {conn.calendarName && ` • ${conn.calendarName}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(conn.id)}
                  disabled={disconnecting === conn.id}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                >
                  {disconnecting === conn.id ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect New Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">
          {connections.length === 0 ? "Connect Your Calendar" : "Add Another Calendar"}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Sync appointments to your calendar automatically. When a visitor books an appointment,
          it will appear in your calendar instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleConnectGoogle}
            disabled={hasGoogle}
            className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">
              {hasGoogle ? "Connected" : "Connect Google Calendar"}
            </span>
          </button>

          <button
            onClick={handleConnectMicrosoft}
            disabled={hasMicrosoft}
            className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#F25022" d="M1 1h10v10H1z" />
              <path fill="#00A4EF" d="M13 1h10v10H13z" />
              <path fill="#7FBA00" d="M1 13h10v10H1z" />
              <path fill="#FFB900" d="M13 13h10v10H13z" />
            </svg>
            <span className="font-medium">
              {hasMicrosoft ? "Connected" : "Connect Outlook Calendar"}
            </span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Appointments booked through your chat widget sync automatically</li>
          <li>• Cancelled appointments are removed from your calendar</li>
          <li>• Your calendar stays up-to-date in real-time</li>
          <li>• All appointment details (name, email, phone, notes) are included</li>
        </ul>
      </div>
    </div>
  );
}

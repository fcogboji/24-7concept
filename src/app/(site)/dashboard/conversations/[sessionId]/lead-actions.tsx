"use client";

import { useState } from "react";

export function LeadActions({
  leadId,
  currentStatus,
  leadEmail,
  leadName,
  botName,
}: {
  leadId: string;
  currentStatus: string;
  leadEmail: string;
  leadName: string | null;
  botName: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [subject, setSubject] = useState(`Following up from ${botName}`);
  const [message, setMessage] = useState(
    `Hi${leadName ? ` ${leadName}` : ""},\n\nThank you for chatting with us. I wanted to follow up on your inquiry.\n\nPlease let me know if you have any questions.\n\nBest regards`
  );
  const [sending, setSending] = useState(false);
  const [emailNote, setEmailNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setStatus(newStatus);
    } catch { /* ignore */ }
    setUpdating(false);
  }

  async function sendFollowUp() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setEmailNote(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailNote({ text: `Follow-up sent to ${leadEmail}`, ok: true });
        setStatus("followed_up");
        setShowEmail(false);
      } else {
        setEmailNote({ text: data.error || "Failed to send", ok: false });
      }
    } catch {
      setEmailNote({ text: "Network error", ok: false });
    }
    setSending(false);
  }

  const statusLabels: Record<string, string> = {
    new: "New",
    followed_up: "Followed up",
    dismissed: "Dismissed",
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="min-h-[44px] rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 outline-none"
          value={status}
          disabled={updating}
          onChange={(e) => updateStatus(e.target.value)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#0d9488] px-3 py-2 text-sm font-medium text-white hover:bg-[#0f7669] transition-colors"
          onClick={() => setShowEmail(!showEmail)}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Follow up
        </button>
      </div>

      {emailNote && (
        <p className={`text-xs ${emailNote.ok ? "text-emerald-700" : "text-red-700"}`}>{emailNote.text}</p>
      )}

      {showEmail && (
        <div className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-1 text-xs font-medium text-gray-500">To: {leadEmail}</p>
          <input
            type="text"
            className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0d9488]"
            rows={5}
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
              onClick={() => setShowEmail(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending || !subject.trim() || !message.trim()}
              className="rounded-lg bg-[#0d9488] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#0f7669] disabled:opacity-50"
              onClick={sendFollowUp}
            >
              {sending ? "Sending…" : "Send email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

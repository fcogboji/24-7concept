import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function transcriptLines(transcript: unknown): { role: string; text: string }[] {
  if (!transcript) return [];
  if (typeof transcript === "string") {
    return [{ role: "system", text: transcript }];
  }
  if (Array.isArray(transcript)) {
    return transcript
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const role = String(r.role ?? r.speaker ?? "unknown");
        const text = String(r.message ?? r.content ?? r.text ?? "").trim();
        if (!text) return null;
        return { role, text };
      })
      .filter(Boolean) as { role: string; text: string }[];
  }
  return [];
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const call = await prisma.callSession.findFirst({
    where: { id, bot: { userId: appUser.id } },
    include: { bot: { select: { id: true, name: true } } },
  });
  if (!call) notFound();

  const [lead, appointment] = await Promise.all([
    call.leadId
      ? prisma.lead.findFirst({ where: { id: call.leadId, bot: { userId: appUser.id } } })
      : null,
    call.appointmentId
      ? prisma.appointment.findFirst({
          where: { id: call.appointmentId, bot: { userId: appUser.id } },
        })
      : null,
  ]);

  const lines = transcriptLines(call.transcript);

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard/calls" className="hover:text-gray-800">
          Calls
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{call.fromNumber || "Call"}</span>
      </nav>
      <DashboardPageHeader
        title={call.fromNumber || "Unknown caller"}
        subtitle={`${call.bot.name} · ${call.status.replace(/_/g, " ")} · ${formatDuration(call.durationSec)}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">To</p>
          <p className="mt-1 font-mono text-sm text-gray-900">{call.toNumber || "—"}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Started</p>
          <p className="mt-1 text-sm text-gray-900">{call.startedAt.toLocaleString()}</p>
        </div>
      </div>

      {call.summary && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Summary</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{call.summary}</p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        {lead ? (
          <Link
            href="/dashboard/leads"
            className="rounded-full bg-teal-50 px-3 py-1.5 font-semibold text-teal-900"
          >
            Lead: {lead.name || lead.email}
          </Link>
        ) : null}
        {appointment ? (
          <Link
            href="/dashboard/appointments"
            className="rounded-full bg-purple-50 px-3 py-1.5 font-semibold text-purple-900"
          >
            Appointment: {appointment.name}
          </Link>
        ) : null}
        {call.recordingUrl ? (
          <a
            href={call.recordingUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-stone-100 px-3 py-1.5 font-semibold text-stone-800"
          >
            Recording
          </a>
        ) : null}
        <Link
          href={`/dashboard/bots/${call.bot.id}/phone`}
          className="rounded-full border border-gray-200 px-3 py-1.5 font-semibold text-gray-700"
        >
          Phone settings
        </Link>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Transcript</h2>
        {lines.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No transcript stored for this call.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lines.map((line, i) => (
              <li key={`${i}-${line.role}`} className="text-sm">
                <span className="font-semibold capitalize text-gray-900">{line.role}: </span>
                <span className="text-gray-700">{line.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

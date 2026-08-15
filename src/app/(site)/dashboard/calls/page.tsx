import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function statusClass(status: string): string {
  if (status === "completed") return "bg-emerald-50 text-emerald-800";
  if (status === "failed" || status === "no_answer") return "bg-amber-50 text-amber-800";
  if (status === "in_progress" || status === "ringing") return "bg-sky-50 text-sky-800";
  return "bg-gray-100 text-gray-700";
}

export default async function CallsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const calls = await prisma.callSession.findMany({
    where: { bot: { userId: appUser.id } },
    include: { bot: { select: { id: true, name: true } } },
    orderBy: { startedAt: "desc" },
    take: 80,
  });

  return (
    <div>
      <DashboardPageHeader
        title="Calls"
        subtitle="Inbound conversations answered by your AI phone receptionist"
      />

      {calls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-gray-900">No calls yet</p>
          <p className="mt-2 text-sm text-gray-600">
            Enable Phone on an assistant, get a number, then place a test call.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {calls.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/calls/${c.id}`}
                className="flex flex-col gap-2 px-4 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {c.fromNumber || "Unknown caller"}
                    <span className="font-normal text-gray-400"> → </span>
                    {c.toNumber || "—"}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-600">
                    {c.bot.name}
                    {c.summary ? ` · ${c.summary}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500">
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold capitalize ${statusClass(c.status)}`}>
                    {c.status.replace(/_/g, " ")}
                  </span>
                  <span>{formatDuration(c.durationSec)}</span>
                  <span>{c.startedAt.toLocaleString()}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

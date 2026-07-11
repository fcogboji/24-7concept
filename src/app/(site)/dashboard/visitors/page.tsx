import { redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

const WINDOW_DAYS = 30;

/** Kept out of the component body: reading the clock during render is an impure call. */
function windowStart(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function Breakdown({
  title,
  hint,
  rows,
  emptyLabel,
}: {
  title: string;
  hint?: string;
  rows: { label: string; count: number }[];
  emptyLabel: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate text-stone-700" title={r.label}>
                {r.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${Math.max(8, (r.count / max) * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium tabular-nums text-stone-900">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function DashboardVisitorsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const since = windowStart(WINDOW_DAYS);
  // Every query is scoped through `bot.userId` so one customer can never see another's visitors.
  const scope = { bot: { userId: appUser.id }, firstSeenAt: { gte: since } };

  const [sessions, byCountry, byDevice, byReferrer, topPages, leadSessions] = await Promise.all([
    prisma.visitorSession.findMany({
      where: scope,
      select: { messageCount: true, sessionId: true },
    }),
    prisma.visitorSession.groupBy({
      by: ["country"],
      where: { ...scope, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 8,
    }),
    prisma.visitorSession.groupBy({
      by: ["device"],
      where: { ...scope, device: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { device: "desc" } },
      take: 5,
    }),
    prisma.visitorSession.groupBy({
      by: ["referrerHost"],
      where: { ...scope, referrerHost: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrerHost: "desc" } },
      take: 8,
    }),
    prisma.visitorSession.groupBy({
      by: ["landingPage"],
      where: { ...scope, landingPage: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { landingPage: "desc" } },
      take: 10,
    }),
    prisma.lead.findMany({
      where: { bot: { userId: appUser.id }, createdAt: { gte: since }, sessionId: { not: null } },
      select: { sessionId: true },
    }),
  ]);

  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((n, s) => n + s.messageCount, 0);
  const sessionIds = new Set(sessions.map((s) => s.sessionId));
  const converted = new Set(
    leadSessions.map((l) => l.sessionId).filter((id): id is string => !!id && sessionIds.has(id)),
  ).size;

  const toRows = (rows: { _count: { _all: number } }[], key: string) =>
    rows.map((r) => ({
      label: String((r as unknown as Record<string, unknown>)[key] ?? "unknown"),
      count: r._count._all,
    }));

  const tiles = [
    { label: "Chat sessions", value: totalSessions.toLocaleString() },
    { label: "Messages", value: totalMessages.toLocaleString() },
    {
      label: "Messages / session",
      value: totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : "—",
    },
    {
      label: "Turned into a lead",
      value: totalSessions > 0 ? `${((converted / totalSessions) * 100).toFixed(1)}%` : "—",
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Visitors"
        subtitle={`Who talked to your assistants in the last ${WINDOW_DAYS} days, and where they came from.`}
      />

      <p className="mt-2 text-xs text-stone-500">
        A session is one browser conversation, not one person. We never store a visitor&apos;s IP address, and this
        data is deleted after 90 days.
      </p>

      {totalSessions === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-stone-900">No visitor data yet</p>
          <p className="mt-1 text-sm text-stone-600">
            Once someone chats with your assistant, you&apos;ll see where they came from here.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{t.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-3 lg:grid-cols-2">
            <Breakdown
              title="Referrer"
              hint="Where visitors were before they reached your site."
              rows={toRows(byReferrer, "referrerHost")}
              emptyLabel="No referrers yet — visitors arrived directly."
            />
            <Breakdown
              title="Country"
              rows={toRows(byCountry, "country")}
              emptyLabel="No country data yet."
            />
            <Breakdown title="Device" rows={toRows(byDevice, "device")} emptyLabel="No device data yet." />
            <Breakdown
              title="Pages that start chats"
              rows={toRows(topPages, "landingPage")}
              emptyLabel="No pages recorded yet."
            />
          </section>
        </>
      )}
    </div>
  );
}

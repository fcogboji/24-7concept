import { prisma } from "@/lib/prisma";

type DayRow = { d: Date; c: bigint };
type PageRow = { pageUrl: string | null; sessions: bigint; messages: bigint };
type TotalsRow = { sessions: bigint; messages: bigint; bots: bigint };
type ConvRow = { converted: bigint };

/**
 * A sessionId is a browser session the widget minted, not a person: the same human on
 * two devices counts twice, and a cleared store starts a new one. Everything here is
 * therefore labelled "sessions", never "unique visitors".
 */
export default async function AdminVisitorsPage() {
  const [daily, totals, topPages, conv] = await Promise.all([
    prisma.$queryRaw<DayRow[]>`
      SELECT date_trunc('day', "createdAt") AS d, COUNT(DISTINCT "sessionId")::bigint AS c
      FROM "Message"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days' AND "sessionId" IS NOT NULL
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<TotalsRow[]>`
      SELECT
        COUNT(DISTINCT "sessionId")::bigint AS sessions,
        COUNT(*)::bigint AS messages,
        COUNT(DISTINCT "botId")::bigint AS bots
      FROM "Message"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days' AND "sessionId" IS NOT NULL
    `,
    prisma.$queryRaw<PageRow[]>`
      SELECT "pageUrl",
             COUNT(DISTINCT "sessionId")::bigint AS sessions,
             COUNT(*)::bigint AS messages
      FROM "Message"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND "pageUrl" IS NOT NULL
        AND "sessionId" IS NOT NULL
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 12
    `,
    prisma.$queryRaw<ConvRow[]>`
      SELECT COUNT(DISTINCT "sessionId")::bigint AS converted
      FROM "Lead"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days' AND "sessionId" IS NOT NULL
    `,
  ]);

  const sessions = Number(totals[0]?.sessions ?? 0);
  const messages = Number(totals[0]?.messages ?? 0);
  const activeBots = Number(totals[0]?.bots ?? 0);
  const converted = Number(conv[0]?.converted ?? 0);

  const msgsPerSession = sessions > 0 ? (messages / sessions).toFixed(1) : "—";
  const convRate = sessions > 0 ? `${((converted / sessions) * 100).toFixed(1)}%` : "—";

  const maxDay = Math.max(1, ...daily.map((r) => Number(r.c)));
  const maxPage = Math.max(1, ...topPages.map((r) => Number(r.sessions)));

  const tiles = [
    { label: "Chat sessions", value: sessions.toLocaleString(), hint: "Distinct sessionIds, last 30 days" },
    { label: "Messages", value: messages.toLocaleString(), hint: "Visitor + assistant rows" },
    { label: "Messages / session", value: msgsPerSession, hint: "Depth of engagement" },
    { label: "Session → lead", value: convRate, hint: `${converted.toLocaleString()} sessions captured a lead` },
    { label: "Assistants engaged", value: activeBots.toLocaleString(), hint: "Bots with at least one session" },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Visitors
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Chat sessions across every assistant on the platform. Last 30 days, by UTC day.
      </p>
      <p className="mt-1 text-xs text-stone-500">
        A session is one browser conversation, not one person — the same visitor on two devices counts twice.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{t.value}</p>
            <p className="mt-0.5 text-xs text-stone-500">{t.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Sessions / day</h2>
        <div className="mt-3 space-y-2">
          {daily.length === 0 && <p className="text-sm text-stone-500">No sessions in this window.</p>}
          {daily.map((row) => (
            <div key={row.d.toISOString()} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-stone-500">
                {row.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${Math.max(8, (Number(row.c) / maxDay) * 100)}%` }}
                />
              </div>
              <span className="w-10 text-right font-medium tabular-nums text-stone-900">{String(row.c)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Top pages</h2>
        <p className="mt-1 text-xs text-stone-500">Where on the customer&apos;s site the conversation started.</p>

        {topPages.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No page URLs recorded yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4 font-semibold">Page</th>
                  <th className="w-40 py-2 pr-4 font-semibold">Sessions</th>
                  <th className="w-24 py-2 text-right font-semibold">Messages</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((row) => (
                  <tr key={row.pageUrl} className="border-b border-stone-100 last:border-0">
                    <td className="max-w-[22rem] truncate py-2 pr-4 text-stone-900" title={row.pageUrl ?? ""}>
                      {row.pageUrl}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{ width: `${Math.max(8, (Number(row.sessions) / maxPage) * 100)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-stone-900">{String(row.sessions)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-stone-600">{String(row.messages)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

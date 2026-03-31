import { prisma } from "@/lib/prisma";

type DayRow = { d: Date; c: bigint };

export default async function AdminAnalyticsPage() {
  const [signups, msgs, bots] = await Promise.all([
    prisma.$queryRaw<DayRow[]>`
      SELECT date_trunc('day', "createdAt") AS d, COUNT(*)::bigint AS c
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<DayRow[]>`
      SELECT date_trunc('day', "createdAt") AS d, COUNT(*)::bigint AS c
      FROM "Message"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<DayRow[]>`
      SELECT date_trunc('day', "createdAt") AS d, COUNT(*)::bigint AS c
      FROM "Bot"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const maxSignup = Math.max(1, ...signups.map((r) => Number(r.c)));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Growth & analytics
      </h1>
      <p className="mt-1 text-sm text-stone-600">Last 30 days, by UTC day.</p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">New users / day</h2>
        <div className="mt-3 space-y-2">
          {signups.length === 0 && <p className="text-sm text-stone-500">No data in this window.</p>}
          {signups.map((row) => (
            <div key={row.d.toISOString()} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-stone-500">
                {row.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${Math.max(8, (Number(row.c) / maxSignup) * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium tabular-nums text-stone-900">{String(row.c)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Messages / day</h2>
        <p className="mt-1 text-xs text-stone-500">All assistant + visitor rows stored.</p>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {msgs.map((row) => (
            <li key={row.d.toISOString()} className="rounded-lg border border-stone-200 bg-white px-3 py-2">
              <span className="text-stone-500">
                {row.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="ml-2 font-semibold text-stone-900">{String(row.c)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">New assistants / day</h2>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((row) => (
            <li key={row.d.toISOString()} className="rounded-lg border border-stone-200 bg-white px-3 py-2">
              <span className="text-stone-500">
                {row.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="ml-2 font-semibold text-stone-900">{String(row.c)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

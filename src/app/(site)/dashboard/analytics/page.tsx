import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * 86_400_000);
  const from60 = new Date(now.getTime() - 60 * 86_400_000);

  const botFilter = { bot: { userId: appUser.id } };

  const [
    messages30,
    leads30,
    appts30,
    messages60prev,
    leads60prev,
    appts60prev,
    leadsBySession30,
    sessions30,
    perBot,
  ] = await Promise.all([
    prisma.message.count({ where: { ...botFilter, createdAt: { gte: from30 } } }),
    prisma.lead.count({ where: { ...botFilter, createdAt: { gte: from30 } } }),
    prisma.appointment.count({ where: { ...botFilter, createdAt: { gte: from30 } } }),
    prisma.message.count({ where: { ...botFilter, createdAt: { gte: from60, lt: from30 } } }),
    prisma.lead.count({ where: { ...botFilter, createdAt: { gte: from60, lt: from30 } } }),
    prisma.appointment.count({ where: { ...botFilter, createdAt: { gte: from60, lt: from30 } } }),
    prisma.lead.findMany({ where: { ...botFilter, createdAt: { gte: from30 } }, select: { sessionId: true } }),
    prisma.message.findMany({
      where: { ...botFilter, createdAt: { gte: from30 }, sessionId: { not: null } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    prisma.bot.findMany({
      where: { userId: appUser.id },
      select: {
        id: true,
        name: true,
        _count: { select: { leads: true, appointments: true, messages: true } },
      },
    }),
  ]);

  const uniqueSessions30 = sessions30.length;
  const conversion =
    uniqueSessions30 > 0 ? ((leads30 / uniqueSessions30) * 100).toFixed(1) + "%" : "—";

  function delta(curr: number, prev: number): string {
    if (prev === 0) return curr > 0 ? "New" : "—";
    const pct = ((curr - prev) / prev) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(0)}% vs prev 30d`;
  }

  return (
    <div>
      <DashboardPageHeader
        title="Analytics"
        subtitle="Last 30 days — how your assistants are converting visitors into leads and bookings."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Conversations" value={uniqueSessions30.toLocaleString()} sub="unique sessions" />
        <Stat label="Messages" value={messages30.toLocaleString()} sub={delta(messages30, messages60prev)} />
        <Stat label="Leads captured" value={leads30.toLocaleString()} sub={delta(leads30, leads60prev)} />
        <Stat label="Bookings" value={appts30.toLocaleString()} sub={delta(appts30, appts60prev)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Stat label="Lead conversion rate" value={conversion} sub="leads ÷ unique sessions" />
        <Stat
          label="Bookings conversion rate"
          value={uniqueSessions30 > 0 ? ((appts30 / uniqueSessions30) * 100).toFixed(1) + "%" : "—"}
          sub="bookings ÷ unique sessions"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-900">Per assistant (all time)</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Assistant</th>
                <th className="px-4 py-3 text-right">Messages</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {perBot.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No assistants yet.
                  </td>
                </tr>
              )}
              {perBot.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-3 text-right">{b._count.messages.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{b._count.leads.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{b._count.appointments.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 text-xs text-gray-400">
        Tip: follow up on new leads within 5 minutes to roughly 9× your conversion rate.
      </p>
    </div>
  );
}

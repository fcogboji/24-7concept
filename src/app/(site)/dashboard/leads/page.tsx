import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

function statusBadge(status: string) {
  switch (status) {
    case "followed_up":
      return "bg-blue-100 text-blue-800";
    case "dismissed":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "followed_up": return "Followed up";
    case "dismissed": return "Dismissed";
    default: return "New";
  }
}

export default async function LeadsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { bot: { userId: appUser.id } },
    include: { bot: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <DashboardPageHeader
        title="Leads"
        subtitle="Contacts captured from your embedded widgets."
        actions={
          leads.length > 0 ? (
            <a
              href="/api/leads/export"
              download
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </a>
          ) : undefined
        }
      />

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-gray-600">
          No leads yet. Embed the script and let conversations run on your site.
        </div>
      ) : (
        <>
        {/* Mobile: card layout */}
        <div className="space-y-3 sm:hidden">
          {leads.map((l) => (
            <div key={l.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{l.name || "—"}</p>
                  <p className="mt-0.5 break-all text-sm text-gray-700">{l.email}</p>
                  {l.phone && <p className="mt-0.5 text-sm text-gray-600">{l.phone}</p>}
                </div>
                <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(l.status)}`}>
                  {statusLabel(l.status)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>{l.bot.name}</span>
                <time dateTime={l.createdAt.toISOString()}>
                  {l.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
              {l.sessionId && (
                <Link
                  href={`/dashboard/conversations/${l.sessionId}`}
                  className="mt-2 inline-block min-h-[44px] leading-[44px] text-sm font-medium text-[#0d9488] hover:underline"
                >
                  View chat &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Assistant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.name || "—"}</td>
                  <td className="break-all px-4 py-3 text-gray-700">{l.email}</td>
                  <td className="px-4 py-3 text-gray-600">{l.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{l.bot.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(l.status)}`}>
                      {statusLabel(l.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-500">
                    <time dateTime={l.createdAt.toISOString()}>
                      {l.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.sessionId && (
                      <Link
                        href={`/dashboard/conversations/${l.sessionId}`}
                        className="text-xs font-medium text-[#0d9488] hover:underline"
                      >
                        View chat
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        </>
      )}

      <p className="mt-6 text-sm text-gray-500">
        <Link href="/dashboard" className="font-medium text-[#0d9488] hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

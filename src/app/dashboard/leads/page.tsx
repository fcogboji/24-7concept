import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

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
        subtitle="Email addresses captured from your embedded widgets."
      />

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-gray-600">
          No leads yet. Embed the script and let conversations run on your site.
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-block min-w-full rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Assistant</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/80">
                  <td className="break-all px-4 py-3 font-medium text-gray-900">{l.email}</td>
                  <td className="px-4 py-3 text-gray-600">{l.bot.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-500">
                    <time dateTime={l.createdAt.toISOString()}>
                      {l.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-500">
        Export or CRM sync can be added later.{" "}
        <Link href="/dashboard" className="font-medium text-[#0d9488] hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

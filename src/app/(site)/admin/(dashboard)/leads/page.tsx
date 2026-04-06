import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ADMIN_LIST_PAGE_SIZE, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const skip = (page - 1) * ADMIN_LIST_PAGE_SIZE;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      include: {
        bot: {
          select: {
            name: true,
            user: { select: { email: true, id: true } },
          },
        },
      },
    }),
    prisma.lead.count(),
  ]);

  const pages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">Leads</h1>
      <p className="mt-1 text-sm text-stone-600">Emails captured from embedded widgets.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Assistant</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-stone-50">
                <td className="break-all px-4 py-3 font-medium">{l.email}</td>
                <td className="px-4 py-3">{l.bot.name}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${l.bot.user.id}`} className="text-teal-800 hover:underline">
                    {l.bot.user.email}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {l.createdAt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && <p className="mt-4 text-stone-500">No leads yet.</p>}

      <div className="mt-6">
        <AdminPagination page={page} pages={pages} total={total} basePath="/admin/leads" />
      </div>
    </div>
  );
}

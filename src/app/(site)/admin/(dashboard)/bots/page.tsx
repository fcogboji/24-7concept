import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ADMIN_LIST_PAGE_SIZE, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

export default async function AdminBotsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const skip = (page - 1) * ADMIN_LIST_PAGE_SIZE;

  const [bots, total] = await Promise.all([
    prisma.bot.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      include: {
        user: { select: { email: true, id: true, plan: true } },
        _count: { select: { messages: true, sources: true, leads: true } },
      },
    }),
    prisma.bot.count(),
  ]);

  const pages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">Assistants</h1>
      <p className="mt-1 text-sm text-stone-600">Every bot across all customers, newest first.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Demo</th>
              <th className="px-4 py-3">Msgs / Leads</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {bots.map((b) => (
              <tr key={b.id} className="hover:bg-stone-50">
                <td className="max-w-[180px] px-4 py-3">
                  <span className="font-medium text-stone-900">{b.name}</span>
                  <div className="truncate text-xs text-stone-500">{b.websiteUrl ?? "—"}</div>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-stone-700">{b.user.email}</td>
                <td className="px-4 py-3">{b.isDemo ? "yes" : "no"}</td>
                <td className="px-4 py-3">
                  {b._count.messages} / {b._count.leads}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {b.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${b.userId}`} className="text-teal-800 hover:underline">
                    Owner
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bots.length === 0 && <p className="mt-4 text-stone-500">No assistants yet.</p>}

      <div className="mt-6">
        <AdminPagination page={page} pages={pages} total={total} basePath="/admin/bots" />
      </div>
    </div>
  );
}

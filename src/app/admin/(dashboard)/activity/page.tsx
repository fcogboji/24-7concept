import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ADMIN_LIST_PAGE_SIZE, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const skip = (page - 1) * ADMIN_LIST_PAGE_SIZE;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      include: {
        user: { select: { email: true, id: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);

  const pages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">Activity log</h1>
      <p className="mt-1 text-sm text-stone-600">
        Signups, bot lifecycle, training, widget leads, admin actions.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {logs.map((a) => (
              <tr key={a.id} className="hover:bg-stone-50">
                <td className="whitespace-nowrap px-4 py-2 text-xs text-stone-600">
                  {a.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{a.action}</td>
                <td className="max-w-[180px] truncate px-4 py-2">
                  {a.user ? (
                    <Link href={`/admin/users/${a.user.id}`} className="text-teal-800 hover:underline">
                      {a.user.email}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[160px] truncate px-4 py-2 text-xs text-stone-600">
                  {a.actorEmail ?? a.actorClerkId ?? "—"}
                </td>
                <td className="px-4 py-2 text-xs text-stone-600">
                  {a.resourceType && (
                    <>
                      {a.resourceType}:{a.resourceId}
                    </>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-stone-500">{a.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && <p className="mt-4 text-stone-500">No audit events yet.</p>}

      <div className="mt-6">
        <AdminPagination page={page} pages={pages} total={total} basePath="/admin/activity" />
      </div>
    </div>
  );
}

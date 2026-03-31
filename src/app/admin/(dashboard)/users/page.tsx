import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where =
    q.length > 0
      ? {
          email: { contains: q, mode: "insensitive" as const },
        }
      : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { bots: true, auditLogs: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const x = new URLSearchParams();
    if (q) x.set("q", q);
    x.set("page", String(p));
    return `/admin/users?${x.toString()}`;
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">Users</h1>
      <p className="mt-1 text-sm text-stone-600">All registered workspaces (Clerk sign-in).</p>

      <form className="mt-6 flex flex-col gap-2 sm:flex-row" method="get" action="/admin/users">
        <input
          name="q"
          type="search"
          placeholder="Search by email…"
          defaultValue={q}
          className="min-h-11 flex-1 rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900 shadow-sm"
        />
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Assistants</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-stone-900">{u.email}</td>
                <td className="px-4 py-3">
                  {u.emailVerifiedAt ? (
                    <span className="text-teal-800">Yes</span>
                  ) : (
                    <span className="font-medium text-amber-800">No</span>
                  )}
                </td>
                <td className="px-4 py-3">{u.plan}</td>
                <td className="px-4 py-3">{u._count.bots}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {u.createdAt.toLocaleDateString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-teal-800 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total === 0 && <p className="mt-4 text-stone-500">No users match.</p>}

      {pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-500">
            Page {page} of {pages} ({total} total)
          </span>
          {page > 1 && (
            <Link
              className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50"
              href={pageHref(page - 1)}
            >
              Previous
            </Link>
          )}
          {page < pages && (
            <Link
              className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50"
              href={pageHref(page + 1)}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

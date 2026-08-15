import { AdminPagination } from "@/components/admin/admin-pagination";
import { ADMIN_LIST_PAGE_SIZE, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

export default async function AdminEarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const skip = (page - 1) * ADMIN_LIST_PAGE_SIZE;

  const [interests, total, phoneCount, whatsappCount] = await Promise.all([
    prisma.productInterest.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
    }),
    prisma.productInterest.count(),
    prisma.productInterest.count({ where: { feature: "phone" } }),
    prisma.productInterest.count({ where: { feature: "whatsapp" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Early-access demand
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Interest collected from the public Phone and WhatsApp validation form.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total signals</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{total}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{phoneCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">WhatsApp</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{whatsappCount}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Feature</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {interests.map((interest) => (
              <tr key={interest.id} className="hover:bg-stone-50">
                <td className="break-all px-4 py-3 font-medium">{interest.email}</td>
                <td className="px-4 py-3 capitalize">{interest.feature}</td>
                <td className="px-4 py-3 capitalize text-stone-600">{interest.source}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                  {interest.createdAt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {interests.length === 0 && <p className="mt-4 text-stone-500">No early-access interest yet.</p>}

      <div className="mt-6">
        <AdminPagination page={page} pages={pages} total={total} basePath="/admin/early-access" />
      </div>
    </div>
  );
}

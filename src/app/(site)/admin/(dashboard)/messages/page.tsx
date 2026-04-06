import Link from "next/link";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ADMIN_LIST_PAGE_SIZE, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

function clip(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n) + "…";
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const skip = (page - 1) * ADMIN_LIST_PAGE_SIZE;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_LIST_PAGE_SIZE,
      include: {
        bot: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true, id: true } },
          },
        },
      },
    }),
    prisma.message.count(),
  ]);

  const pages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">Messages</h1>
      <p className="mt-1 text-sm text-stone-600">Stored chat rows (user + assistant), newest first.</p>

      <ul className="mt-6 space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-xl border px-4 py-3 text-sm ${
              m.role === "user" ? "border-stone-200 bg-white" : "border-teal-100 bg-teal-50/40"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-stone-500">
              <span className="font-semibold uppercase">{m.role}</span>
              <span>
                {m.bot.user.email} · {m.bot.name}
              </span>
              <span>{m.createdAt.toLocaleString()}</span>
            </div>
            <p className="mt-2 break-words text-stone-800">{clip(m.content, 800)}</p>
            <Link
              href={`/admin/users/${m.bot.user.id}`}
              className="mt-2 inline-block text-xs font-medium text-teal-800 hover:underline"
            >
              User profile
            </Link>
          </li>
        ))}
      </ul>

      {messages.length === 0 && <p className="mt-4 text-stone-500">No messages yet.</p>}

      <div className="mt-6">
        <AdminPagination page={page} pages={pages} total={total} basePath="/admin/messages" />
      </div>
    </div>
  );
}

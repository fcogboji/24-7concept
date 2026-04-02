import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

function clip(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n) + "…";
}

export default async function ConversationsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const messages = await prisma.message.findMany({
    where: { bot: { userId: appUser.id } },
    include: { bot: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return (
    <div>
      <DashboardPageHeader
        title="Conversations"
        subtitle="Recent messages across all your assistants."
      />

      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-gray-600">
          No messages yet.{" "}
          <Link href="/dashboard/bots/new" className="font-medium text-[#0d9488] underline">
            Create an assistant
          </Link>{" "}
          and embed the script on your site.
        </div>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border px-4 py-3 text-sm break-words ${
                m.role === "user"
                  ? "border-gray-200 bg-white text-gray-900 shadow-sm"
                  : "border-teal-100 bg-teal-50/40 text-gray-800"
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold uppercase text-gray-600">
                  {m.role === "user" ? "Visitor" : "Assistant"}
                </span>
                <span className="text-gray-400">·</span>
                <span className="font-medium text-gray-700">{m.bot.name}</span>
                <time className="ml-auto" dateTime={m.createdAt.toISOString()}>
                  {m.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-gray-800">{clip(m.content, 800)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

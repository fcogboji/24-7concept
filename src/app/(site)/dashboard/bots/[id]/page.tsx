import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { BotActivity } from "./bot-activity";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({
    where: { id, userId: appUser.id },
    include: { _count: { select: { sources: true, messages: true } } },
  });

  if (!bot) notFound();

  const [recentMessages, leads] = await Promise.all([
    prisma.message.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, role: true, content: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, email: true, createdAt: true },
    }),
  ]);

  const tabs = [
    { href: `/dashboard/bots/${bot.id}/appearance`, label: "Widget" },
    { href: `/dashboard/bots/${bot.id}/knowledge`, label: "Knowledge base" },
  ];

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-800">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{bot.name}</span>
      </nav>
      <DashboardPageHeader
        title={bot.name}
        subtitle={`${bot.websiteUrl ?? "No website URL yet"} · ${bot._count.sources} chunks · ${bot._count.messages} messages`}
      />

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-[#0d9488]/40 hover:bg-teal-50/50"
          >
            {t.label}
            <span className="mt-1 block text-xs font-normal text-gray-500">Open section →</span>
          </Link>
        ))}
      </div>

      <BotActivity messages={recentMessages} leads={leads} />
    </div>
  );
}

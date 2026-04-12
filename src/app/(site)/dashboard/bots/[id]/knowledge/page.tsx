import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { BotKnowledgePanel } from "../bot-knowledge-panel";

export default async function BotKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({
    where: { id, userId: appUser.id },
    include: { _count: { select: { sources: true, messages: true } } },
  });

  if (!bot) notFound();

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
        title="Knowledge base"
        subtitle="Train your assistant on content from your website."
      />
      <BotKnowledgePanel
        bot={{
          id: bot.id,
          name: bot.name,
          websiteUrl: bot.websiteUrl,
          avatarUrl: bot.avatarUrl,
          businessInfo: bot.businessInfo,
          sources: bot._count.sources,
          messages: bot._count.messages,
        }}
      />
    </div>
  );
}

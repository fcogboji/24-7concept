import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BotActivity } from "./bot-activity";
import { BotPanel } from "./bot-panel";

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({
    where: { id, userId: session.user.id },
    include: { _count: { select: { sources: true, messages: true } } },
  });

  if (!bot) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-stone-500 hover:text-stone-800">
        ← Assistants
      </Link>
      <BotPanel
        bot={{
          id: bot.id,
          name: bot.name,
          websiteUrl: bot.websiteUrl,
          sources: bot._count.sources,
          messages: bot._count.messages,
        }}
        appUrl={appUrl}
      />
      <BotActivity messages={recentMessages} leads={leads} />
    </div>
  );
}

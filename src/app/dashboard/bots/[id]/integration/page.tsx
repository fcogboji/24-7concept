import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { BotIntegrationPanel } from "../bot-integration-panel";

export default async function BotIntegrationPage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({
    where: { id, userId: appUser.id },
  });

  if (!bot) notFound();

  const appUrl = await getPublicAppUrl();

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
        title="Integration"
        subtitle="Add the bot to your website with one script tag."
      />
      <BotIntegrationPanel
        bot={{ id: bot.id, name: bot.name, isDemo: bot.isDemo }}
        appUrl={appUrl}
      />
    </div>
  );
}

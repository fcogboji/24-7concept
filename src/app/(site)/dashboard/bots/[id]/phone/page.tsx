import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { isVapiConfigured } from "@/lib/vapi";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { PhoneConfigPanel } from "./phone-config-panel";

export default async function PhonePage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) notFound();

  const [config, booking] = await Promise.all([
    prisma.phoneConfig.findUnique({ where: { botId: id } }),
    prisma.bookingConfig.findUnique({ where: { botId: id }, select: { enabled: true } }),
  ]);

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-800">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/bots/${bot.id}`} className="hover:text-gray-800">
          {bot.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Phone</span>
      </nav>
      <DashboardPageHeader
        title="Phone answering"
        subtitle="Let your AI receptionist answer inbound calls, capture leads, and book appointments"
      />
      <PhoneConfigPanel
        botId={bot.id}
        initial={config}
        bookingEnabled={Boolean(booking?.enabled)}
        platformReady={isVapiConfigured()}
      />
    </div>
  );
}

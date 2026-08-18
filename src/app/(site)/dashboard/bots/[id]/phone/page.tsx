import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { isVapiConfigured } from "@/lib/vapi";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { PhoneConfigPanel } from "./phone-config-panel";
import { getWorkspaceUsage } from "@/lib/usage";

export default async function PhonePage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) notFound();

  const [config, booking, usage] = await Promise.all([
    prisma.phoneConfig.findUnique({ where: { botId: id } }),
    prisma.bookingConfig.findUnique({ where: { botId: id }, select: { enabled: true } }),
    getWorkspaceUsage(appUser.id),
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
      {usage && usage.phoneMinutesLimit > 0 && (
        <p className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          This month: <strong>{usage.phoneMinutesUsed}</strong> / {usage.phoneMinutesLimit} AI phone minutes ·{" "}
          {usage.concurrentLimit} concurrent call{usage.concurrentLimit === 1 ? "" : "s"} max. When the allowance
          runs out, calls pause and visitors can still chat or leave a callback.
        </p>
      )}
      <PhoneConfigPanel
        botId={bot.id}
        initial={config}
        bookingEnabled={Boolean(booking?.enabled)}
        platformReady={isVapiConfigured()}
      />
    </div>
  );
}

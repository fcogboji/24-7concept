import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { BookingConfigPanel } from "./booking-config-panel";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) notFound();

  const config = await prisma.bookingConfig.findUnique({
    where: { botId: id },
    include: {
      weeklyHours: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      services: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      blockedDates: { orderBy: { date: "asc" } },
    },
  });

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/bots/${bot.id}`} className="hover:text-gray-800">{bot.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Booking</span>
      </nav>
      <DashboardPageHeader
        title="Booking Settings"
        subtitle="Let your AI assistant book appointments for visitors"
      />
      <BookingConfigPanel botId={bot.id} initial={config} />
    </div>
  );
}

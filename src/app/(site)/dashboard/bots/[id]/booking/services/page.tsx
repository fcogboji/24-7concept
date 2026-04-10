import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ServicesPanel } from "./services-panel";

export default async function ServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { id } = await params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) notFound();

  const config = await prisma.bookingConfig.findUnique({ where: { botId: id } });
  const services = config
    ? await prisma.service.findMany({
        where: { bookingConfigId: config.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/bots/${bot.id}`} className="hover:text-gray-800">{bot.name}</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/bots/${bot.id}/booking`} className="hover:text-gray-800">Booking</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Services</span>
      </nav>
      <DashboardPageHeader
        title="Services"
        subtitle="Define the appointment types visitors can book"
      />
      <ServicesPanel botId={bot.id} initial={services} />
    </div>
  );
}

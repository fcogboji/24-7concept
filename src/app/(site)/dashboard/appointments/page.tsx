import { redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AppointmentsList } from "./appointments-list";

export default async function AppointmentsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const bots = await prisma.bot.findMany({
    where: { userId: appUser.id },
    select: { id: true, name: true },
  });

  const botIds = bots.map((b) => b.id);
  const botMap = Object.fromEntries(bots.map((b) => [b.id, b.name]));

  const appointments = botIds.length
    ? await prisma.appointment.findMany({
        where: { botId: { in: botIds } },
        include: { service: { select: { name: true } } },
        orderBy: { startTime: "desc" },
        take: 200,
      })
    : [];

  const serialized = appointments.map((a) => ({
    id: a.id,
    botId: a.botId,
    botName: botMap[a.botId] ?? "Unknown",
    name: a.name,
    email: a.email,
    phone: a.phone,
    serviceName: a.service?.name ?? null,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    timezone: a.timezone,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div>
      <DashboardPageHeader
        title="Appointments"
        subtitle="View and manage all booked appointments"
      />
      <AppointmentsList appointments={serialized} />
    </div>
  );
}

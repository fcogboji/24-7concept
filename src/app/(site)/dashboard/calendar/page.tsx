import { redirect } from "next/navigation";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { CalendarConnectionsPanel } from "./calendar-connections-panel";

export default async function CalendarPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const connections = await prisma.calendarConnection.findMany({
    where: { userId: appUser.id, active: true },
    orderBy: { createdAt: "desc" },
  });

  const serialized = connections.map((c) => ({
    id: c.id,
    provider: c.provider,
    email: c.email,
    calendarId: c.calendarId,
    calendarName: c.calendarName,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div>
      <DashboardPageHeader
        title="Calendar Sync"
        subtitle="Connect your calendar to automatically sync appointments"
      />
      <CalendarConnectionsPanel connections={serialized} />
    </div>
  );
}

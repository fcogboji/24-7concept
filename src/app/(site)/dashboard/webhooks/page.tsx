import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { WebhookManager } from "./webhook-manager";

export default async function WebhooksPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const hooks = await prisma.webhook.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardPageHeader
        title="Webhooks & Zapier"
        subtitle="Send new leads and bookings to any URL — Zapier, Make, HubSpot, Pipedrive, your own backend."
      />
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">How it works</h2>
        <p className="mt-1 text-sm text-gray-600">
          We POST a JSON payload to your URL with header <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">x-faztino-event</code>.
          Supported events: <code className="text-xs">lead.created</code>, <code className="text-xs">appointment.created</code>.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          In Zapier, create a Zap with a <strong>Webhooks by Zapier → Catch Hook</strong> trigger, paste the URL here, and
          connect it to HubSpot / Pipedrive / Google Sheets / Slack / 5000+ apps.
        </p>
      </div>
      <WebhookManager initial={hooks.map((h) => ({ id: h.id, url: h.url, label: h.label, events: h.events, active: h.active }))} />
    </div>
  );
}

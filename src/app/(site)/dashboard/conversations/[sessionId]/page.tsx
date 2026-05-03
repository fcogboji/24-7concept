import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { LeadActions } from "./lead-actions";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const { sessionId } = await params;

  if (sessionId.startsWith("unsorted-")) {
    return (
      <div>
        <DashboardPageHeader title="Conversation" subtitle="" />
        <p className="text-gray-600">This conversation has no session ID and cannot be viewed in detail.</p>
        <Link href="/dashboard/conversations" className="mt-4 inline-block text-sm font-medium text-[#0d9488] hover:underline">
          &larr; Back to inbox
        </Link>
      </div>
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      sessionId,
      bot: { userId: appUser.id },
    },
    include: { bot: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length === 0) notFound();

  const lead = await prisma.lead.findFirst({
    where: { sessionId, bot: { userId: appUser.id } },
  });

  const botName = messages[0].bot.name;
  const pageUrl = messages.find((m) => m.pageUrl)?.pageUrl;

  return (
    <div>
      <DashboardPageHeader
        title={lead?.name || lead?.email || "Anonymous Visitor"}
        subtitle={`Conversation with ${botName}`}
      />

      <Link href="/dashboard/conversations" className="mb-6 inline-block text-sm font-medium text-[#0d9488] hover:underline">
        &larr; Back to inbox
      </Link>

      {/* Lead info card */}
      {lead && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Contact Details</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {lead.name && <p><span className="font-medium text-gray-800">Name:</span> {lead.name}</p>}
                <p><span className="font-medium text-gray-800">Email:</span> {lead.email}</p>
                {lead.phone && <p><span className="font-medium text-gray-800">Phone:</span> {lead.phone}</p>}
                {pageUrl && <p><span className="font-medium text-gray-800">Page:</span> <span className="break-all">{pageUrl}</span></p>}
              </div>
            </div>
            <LeadActions leadId={lead.id} currentStatus={lead.status} leadEmail={lead.email} leadName={lead.name} botName={botName} />
          </div>
        </div>
      )}

      {/* Message thread */}
      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border px-4 py-3 text-sm ${
              m.role === "user"
                ? "border-gray-200 bg-white text-gray-900 shadow-sm"
                : "border-teal-100 bg-teal-50/40 text-gray-800"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold uppercase text-gray-600">
                {m.role === "user" ? (lead?.name || "Visitor") : "Assistant"}
              </span>
              <time className="ml-auto" dateTime={m.createdAt.toISOString()}>
                {m.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-gray-800">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

function clip(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : t.slice(0, n) + "…";
}

type SessionGroup = {
  sessionId: string | null;
  botName: string;
  botId: string;
  messages: { id: string; role: string; content: string; createdAt: Date; pageUrl: string | null }[];
  lead: { id: string; name: string | null; email: string; phone: string | null; status: string } | null;
  firstMessage: Date;
  lastMessage: Date;
  pageUrl: string | null;
};

export default async function ConversationsPage() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const messages = await prisma.message.findMany({
    where: { bot: { userId: appUser.id } },
    include: { bot: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Group messages by sessionId
  const sessionMap = new Map<string, SessionGroup>();

  for (const m of messages) {
    const key = m.sessionId || `no-session-${m.botId}-${m.createdAt.toISOString().slice(0, 13)}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        sessionId: m.sessionId,
        botName: m.bot.name,
        botId: m.bot.id,
        messages: [],
        lead: null,
        firstMessage: m.createdAt,
        lastMessage: m.createdAt,
        pageUrl: m.pageUrl,
      });
    }
    const group = sessionMap.get(key)!;
    group.messages.push({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      pageUrl: m.pageUrl,
    });
    if (m.createdAt < group.firstMessage) group.firstMessage = m.createdAt;
    if (m.createdAt > group.lastMessage) group.lastMessage = m.createdAt;
  }

  // Fetch leads linked to sessions
  const sessionIds = [...sessionMap.values()]
    .map((g) => g.sessionId)
    .filter((s): s is string => s !== null);

  const leads = sessionIds.length > 0
    ? await prisma.lead.findMany({
        where: { sessionId: { in: sessionIds } },
      })
    : [];

  const leadBySession = new Map(leads.map((l) => [l.sessionId, l]));

  for (const [, group] of sessionMap) {
    if (group.sessionId) {
      const lead = leadBySession.get(group.sessionId);
      if (lead) {
        group.lead = { id: lead.id, name: lead.name, email: lead.email, phone: lead.phone, status: lead.status };
      }
    }
    // Sort messages chronologically within each group
    group.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Sort sessions by most recent first
  const sessions = [...sessionMap.values()].sort(
    (a, b) => b.lastMessage.getTime() - a.lastMessage.getTime()
  );

  // Get first user message as summary
  function getSessionSummary(group: SessionGroup): string {
    const firstUserMsg = group.messages.find((m) => m.role === "user");
    return firstUserMsg ? clip(firstUserMsg.content, 120) : "No messages";
  }

  function statusBadge(status: string) {
    switch (status) {
      case "followed_up":
        return "bg-blue-100 text-blue-800";
      case "dismissed":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-emerald-100 text-emerald-800";
    }
  }

  function statusLabel(status: string) {
    switch (status) {
      case "followed_up": return "Followed up";
      case "dismissed": return "Dismissed";
      default: return "New";
    }
  }

  return (
    <div>
      <DashboardPageHeader
        title="Conversation Inbox"
        subtitle="Every chat session, grouped and linked to leads."
      />

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-gray-600">
          No conversations yet.{" "}
          <Link href="/dashboard/bots/new" className="font-medium text-[#0d9488] underline">
            Create an assistant
          </Link>{" "}
          and embed the script on your site.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, idx) => {
            const msgCount = s.messages.length;
            const userMsgCount = s.messages.filter((m) => m.role === "user").length;
            return (
              <Link
                key={s.sessionId || idx}
                href={`/dashboard/conversations/${s.sessionId || `unsorted-${idx}`}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-[#0d9488]/30 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {s.lead ? (
                        <span className="font-semibold text-gray-900">
                          {s.lead.name || s.lead.email}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-500">Anonymous visitor</span>
                      )}
                      {s.lead && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(s.lead.status)}`}>
                          {statusLabel(s.lead.status)}
                        </span>
                      )}
                    </div>

                    {s.lead?.email && s.lead.name && (
                      <p className="text-xs text-gray-500">{s.lead.email}{s.lead.phone ? ` · ${s.lead.phone}` : ""}</p>
                    )}

                    <p className="mt-1 text-sm text-gray-700">{getSessionSummary(s)}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{s.botName}</span>
                      <span>{userMsgCount} question{userMsgCount !== 1 ? "s" : ""} · {msgCount} messages</span>
                      {s.pageUrl && (
                        <span className="hidden truncate max-w-[200px] sm:inline" title={s.pageUrl}>
                          {new URL(s.pageUrl).pathname}
                        </span>
                      )}
                    </div>
                  </div>

                  <time className="shrink-0 text-xs text-gray-400" dateTime={s.lastMessage.toISOString()}>
                    {s.lastMessage.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

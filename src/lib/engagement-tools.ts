import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/prisma";
import { sendLeadNotificationToOwner } from "@/lib/booking-emails";
import { sendTransactionalEmail } from "@/lib/email";
import { fireWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";
import { getLogger } from "@/lib/logger";

const log = getLogger("engagement-tools");

export const engagementTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "capture_lead",
      description:
        "Save a visitor's contact details so the team can follow up. Call this when the visitor asks something you cannot answer, expresses interest in being contacted, or shares a problem that needs human follow-up. Always confirm with the visitor before calling, and only collect what they have offered.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Visitor's email address" },
          name: { type: "string", description: "Visitor's name (optional)" },
          phone: { type: "string", description: "Visitor's phone (optional)" },
          reason: {
            type: "string",
            description:
              "Brief 1-line summary of why they want to be contacted (e.g. 'asked about pricing for 50-seat plan').",
          },
        },
        required: ["email", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description:
        "Hand the conversation to the business owner via email. Use when the visitor explicitly asks for a human, has a complaint, or the situation is sensitive (refund, account issue, urgent problem).",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "1-3 sentence summary of what the visitor needs and what has been discussed so far.",
          },
          email: { type: "string", description: "Visitor's email if they shared one (optional)" },
          name: { type: "string", description: "Visitor's name if they shared one (optional)" },
        },
        required: ["summary"],
      },
    },
  },
];

export interface EngagementToolContext {
  botId: string;
  sessionId?: string | null;
  pageUrl?: string | null;
}

export async function handleEngagementTool(
  name: string,
  args: Record<string, unknown>,
  ctx: EngagementToolContext,
): Promise<string> {
  switch (name) {
    case "capture_lead":
      return handleCaptureLead(ctx, args as unknown as CaptureLeadArgs);
    case "escalate_to_human":
      return handleEscalate(ctx, args as unknown as EscalateArgs);
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

interface CaptureLeadArgs {
  email: string;
  name?: string;
  phone?: string;
  reason: string;
}

async function handleCaptureLead(ctx: EngagementToolContext, args: CaptureLeadArgs): Promise<string> {
  const email = args.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return JSON.stringify({ error: "A valid email is required." });
  }

  const bot = await prisma.bot.findUnique({
    where: { id: ctx.botId },
    select: { userId: true, name: true, user: { select: { email: true } } },
  });
  if (!bot) return JSON.stringify({ error: "Assistant not found." });

  const existing = await prisma.lead.findFirst({ where: { botId: ctx.botId, email } });
  const lead =
    existing ??
    (await prisma.lead.create({
      data: {
        botId: ctx.botId,
        email,
        name: args.name?.trim() || null,
        phone: args.phone?.trim() || null,
        sessionId: ctx.sessionId || null,
        pageUrl: ctx.pageUrl || null,
        source: "chatbot",
      },
    }));

  if (existing && (args.name || args.phone)) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        ...(args.name?.trim() && !existing.name ? { name: args.name.trim() } : {}),
        ...(args.phone?.trim() && !existing.phone ? { phone: args.phone.trim() } : {}),
      },
    });
  }

  if (!existing && bot.user.email) {
    void sendLeadNotificationToOwner({
      ownerEmail: bot.user.email,
      botName: bot.name,
      leadEmail: lead.email,
      leadName: lead.name,
      leadPhone: lead.phone,
      pageUrl: ctx.pageUrl ?? null,
    });
  }

  if (!existing) {
    void fireWebhooks(bot.userId, "lead.created", {
      leadId: lead.id,
      botId: ctx.botId,
      botName: bot.name,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      pageUrl: ctx.pageUrl ?? null,
      sessionId: ctx.sessionId ?? null,
      source: "chatbot",
      reason: args.reason,
    });

    void logAudit({
      userId: bot.userId,
      action: "lead.captured",
      resourceType: "lead",
      resourceId: lead.id,
      meta: { botId: ctx.botId, source: "chatbot", reason: args.reason },
    });
  }

  return JSON.stringify({
    success: true,
    note: existing
      ? "Already on file — flagged this new request for the team."
      : "Saved. The team will follow up by email.",
  });
}

interface EscalateArgs {
  summary: string;
  email?: string;
  name?: string;
}

async function handleEscalate(ctx: EngagementToolContext, args: EscalateArgs): Promise<string> {
  const summary = args.summary?.trim();
  if (!summary) return JSON.stringify({ error: "A summary is required." });

  const bot = await prisma.bot.findUnique({
    where: { id: ctx.botId },
    select: { name: true, user: { select: { email: true } } },
  });
  if (!bot?.user.email) {
    return JSON.stringify({ error: "No owner email on file. Please share your details so we can follow up." });
  }

  const recentMessages = ctx.sessionId
    ? await prisma.message.findMany({
        where: { botId: ctx.botId, sessionId: ctx.sessionId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { role: true, content: true },
      })
    : [];

  const transcript = recentMessages
    .reverse()
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${esc(m.content)}`)
    .join("<br/>");

  try {
    await sendTransactionalEmail({
      to: bot.user.email,
      subject: `Visitor asked for a human — ${bot.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#0d9488;margin:0 0 16px">Escalation from your assistant</h2>
          <p style="margin:0 0 12px;color:#444">${esc(summary)}</p>
          ${args.name ? `<p style="margin:0;color:#444"><strong>Name:</strong> ${esc(args.name)}</p>` : ""}
          ${args.email ? `<p style="margin:0;color:#444"><strong>Email:</strong> <a href="mailto:${esc(args.email)}">${esc(args.email)}</a></p>` : ""}
          ${ctx.pageUrl ? `<p style="margin:0;color:#444"><strong>Page:</strong> <a href="${esc(ctx.pageUrl)}">${esc(ctx.pageUrl)}</a></p>` : ""}
          ${transcript ? `<hr style="margin:16px 0;border:none;border-top:1px solid #eee"/><p style="margin:0 0 8px;color:#888;font-size:13px">Recent transcript</p><div style="font-size:13px;color:#444">${transcript}</div>` : ""}
        </div>`,
    });
  } catch (e) {
    log.error("escalate email failed", e, { botId: ctx.botId });
    return JSON.stringify({ error: "Could not send escalation right now. Please share your email and we'll follow up." });
  }

  return JSON.stringify({
    success: true,
    note: "Escalated. Tell the visitor someone from the team will reach out shortly.",
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

import { prisma } from "@/lib/prisma";
import { getRelevantChunks } from "@/lib/retrieve";
import { handleBookingTool } from "@/lib/booking-tools";
import { handleEngagementTool } from "@/lib/engagement-tools";
import { sendLeadNotificationToOwner } from "@/lib/booking-emails";
import { fireWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";
import { sendNewLeadNotification } from "@/lib/push-notifications";
import { getLogger } from "@/lib/logger";

const log = getLogger("phone-tools");

function toolResultText(result: Awaited<ReturnType<typeof handleBookingTool>>): string {
  if (typeof result === "string") return result;
  return result.toolResult;
}

function normalizePhone(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? digits : null;
}

/**
 * Phone-channel lead capture: email optional if a phone number is present.
 * Uses a stable placeholder email when only phone is known (Lead.email is required).
 */
async function capturePhoneLead(
  botId: string,
  callId: string,
  args: { email?: string; name?: string; phone?: string; reason: string; callerPhone?: string | null },
): Promise<string> {
  const phone = normalizePhone(args.phone) || normalizePhone(args.callerPhone);
  let email = args.email?.trim().toLowerCase() || "";
  if (!email && phone) {
    const key = phone.replace(/\D/g, "").slice(-12) || "unknown";
    email = `phone+${key}@phone.faztino.local`;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return JSON.stringify({
      error: "Need at least a phone number or email to save the lead.",
    });
  }

  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: { userId: true, name: true, user: { select: { email: true } } },
  });
  if (!bot) return JSON.stringify({ error: "Assistant not found." });

  const existing = await prisma.lead.findFirst({
    where: {
      botId,
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
    },
  });

  const lead =
    existing ??
    (await prisma.lead.create({
      data: {
        botId,
        email,
        name: args.name?.trim() || null,
        phone: phone,
        sessionId: callId,
        source: "phone",
      },
    }));

  if (existing) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        ...(args.name?.trim() && !existing.name ? { name: args.name.trim() } : {}),
        ...(phone && !existing.phone ? { phone } : {}),
        sessionId: existing.sessionId || callId,
      },
    });
  }

  await prisma.callSession.updateMany({
    where: { vapiCallId: callId },
    data: { leadId: lead.id },
  });

  if (!existing && bot.user.email) {
    void sendLeadNotificationToOwner({
      ownerEmail: bot.user.email,
      botName: bot.name,
      leadEmail: lead.email,
      leadName: lead.name,
      leadPhone: lead.phone,
      pageUrl: null,
    });
    void sendNewLeadNotification(bot.userId, {
      name: lead.name ?? undefined,
      email: lead.email,
    });
    void fireWebhooks(bot.userId, "lead.created", {
      leadId: lead.id,
      botId,
      botName: bot.name,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      source: "phone",
      reason: args.reason,
      callId,
    });
    void logAudit({
      userId: bot.userId,
      action: "lead.captured",
      resourceType: "lead",
      resourceId: lead.id,
      meta: { botId, source: "phone", reason: args.reason, callId },
    });
  }

  return JSON.stringify({
    success: true,
    leadId: lead.id,
    note: existing ? "Lead already on file; details updated." : "Lead saved from phone call.",
  });
}

export async function runPhoneTool(opts: {
  botId: string;
  callId: string;
  name: string;
  args: Record<string, unknown>;
  callerPhone?: string | null;
  forwardingNumber?: string | null;
}): Promise<string> {
  const { botId, callId, name, args, callerPhone, forwardingNumber } = opts;

  try {
    switch (name) {
      case "search_knowledge": {
        const query = typeof args.query === "string" ? args.query : "";
        if (!query.trim()) return JSON.stringify({ error: "query required" });
        const chunks = await getRelevantChunks(botId, query, 5);
        if (chunks.length === 0) {
          return JSON.stringify({
            found: false,
            note: "No matching knowledge. Say you will have someone follow up and capture a lead.",
          });
        }
        return JSON.stringify({
          found: true,
          excerpts: chunks.map((c) => c.slice(0, 500)),
        });
      }
      case "capture_lead":
        return capturePhoneLead(botId, callId, {
          email: typeof args.email === "string" ? args.email : undefined,
          name: typeof args.name === "string" ? args.name : undefined,
          phone: typeof args.phone === "string" ? args.phone : undefined,
          reason: typeof args.reason === "string" ? args.reason : "Phone enquiry",
          callerPhone,
        });
      case "list_services":
      case "check_availability":
      case "create_appointment": {
        const booking = await prisma.bookingConfig.findUnique({
          where: { botId },
          select: { enabled: true },
        });
        if (!booking?.enabled) {
          return JSON.stringify({
            error: "Booking is not enabled. Capture a lead for a callback instead.",
          });
        }
        // Prefer spoken phone if create_appointment omitted it
        const enriched =
          name === "create_appointment" && !args.phone && callerPhone
            ? { ...args, phone: callerPhone }
            : args;
        const result = await handleBookingTool(name, enriched, { botId, sessionId: callId });
        const text = toolResultText(result);
        if (name === "create_appointment") {
          try {
            const parsed = JSON.parse(text) as { success?: boolean; appointmentId?: string };
            if (parsed.success && parsed.appointmentId) {
              await prisma.callSession.updateMany({
                where: { vapiCallId: callId },
                data: { appointmentId: parsed.appointmentId },
              });
            }
          } catch {
            /* ignore */
          }
        }
        return text;
      }
      case "transfer_to_human": {
        if (!forwardingNumber) {
          return JSON.stringify({
            error: "No forwarding number configured. Capture a lead instead.",
          });
        }
        return JSON.stringify({
          success: true,
          transferNumber: forwardingNumber,
          instruction: `Tell the caller you are connecting them now, then transfer to ${forwardingNumber}.`,
        });
      }
      default: {
        // Fall through to chat engagement tools if name matches
        if (name === "escalate_to_human") {
          return handleEngagementTool(name, args, {
            botId,
            sessionId: callId,
            source: "phone",
          });
        }
        log.warn("unknown phone tool", { name });
        return JSON.stringify({ error: "Unknown tool" });
      }
    }
  } catch (e) {
    log.error("phone tool failed", e, { name, botId });
    return JSON.stringify({
      error: "Temporary issue. Apologize and offer a callback via capture_lead.",
    });
  }
}

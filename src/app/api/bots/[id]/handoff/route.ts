import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";
import { rateLimitAuth } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { phonePlaceholderEmail, toE164 } from "@/lib/phone-number";
import { sendHandoffNotificationToOwner } from "@/lib/booking-emails";
import { fireWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";
import { sendNewLeadNotification } from "@/lib/push-notifications";
import { getLogger } from "@/lib/logger";
import { safeHttpUrlForDisplay } from "@/lib/url-safety";

const log = getLogger("widget-handoff");

const bodySchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  countryCode: z.string().min(1).max(4).optional(),
  phone: z.string().max(24).optional(),
  message: z.string().trim().min(2).max(2000),
  sessionId: z.string().regex(/^s_[a-f0-9]{8,64}$/).optional(),
  pageUrl: z.string().max(2000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS(req: NextRequest) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id: botId } = await context.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please add a short message, plus an email or phone number." },
        { status: 400, headers: cors },
      );
    }

    const emailRaw = parsed.data.email?.trim().toLowerCase() || "";
    const e164 =
      parsed.data.countryCode && parsed.data.phone
        ? toE164(parsed.data.countryCode, parsed.data.phone)
        : null;
    if (!emailRaw && !e164) {
      return NextResponse.json(
        { error: "Add an email or phone number so the team can reach you." },
        { status: 400, headers: cors },
      );
    }

    const ip = getClientIp(req);
    const limit = await rateLimitAuth(`handoff:${ip}:${botId}`, 5, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { ...cors, "Retry-After": String(limit.retryAfter) } },
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true, name: true, userId: true, user: { select: { email: true } } },
    });
    if (!bot) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404, headers: cors });
    }

    const pageUrl = safeHttpUrlForDisplay(parsed.data.pageUrl);
    const email = emailRaw || (e164 ? phonePlaceholderEmail(e164) : "");
    const existing = await prisma.lead.findFirst({
      where: {
        botId,
        OR: [...(emailRaw ? [{ email: emailRaw }] : []), ...(e164 ? [{ phone: e164 }] : [])],
      },
    });
    const lead =
      existing ??
      (await prisma.lead.create({
        data: {
          botId,
          email,
          name: parsed.data.name?.trim() || null,
          phone: e164,
          sessionId: parsed.data.sessionId ?? null,
          pageUrl,
          source: "handoff",
        },
      }));

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          ...(parsed.data.name?.trim() && !existing.name ? { name: parsed.data.name.trim() } : {}),
          ...(e164 && !existing.phone ? { phone: e164 } : {}),
        },
      });
    }

    if (!existing) {
      if (bot.user.email) {
        void sendHandoffNotificationToOwner({
          ownerEmail: bot.user.email,
          botName: bot.name,
          name: parsed.data.name ?? null,
          email: emailRaw || null,
          phone: e164,
          message: parsed.data.message,
          pageUrl,
        });
      }
      void sendNewLeadNotification(bot.userId, {
        name: parsed.data.name ?? undefined,
        email: lead.email,
      });
      void fireWebhooks(bot.userId, "lead.created", {
        leadId: lead.id,
        botId,
        botName: bot.name,
        email: lead.email,
        name: parsed.data.name ?? null,
        phone: e164,
        source: "handoff",
      });
      void logAudit({
        userId: bot.userId,
        action: "lead.captured",
        resourceType: "lead",
        resourceId: lead.id,
        meta: { botId, source: "handoff" },
        ip,
      });
    }

    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    log.error("handoff route error", e);
    return NextResponse.json({ error: "Could not send that just now. Try again." }, { status: 500, headers: cors });
  }
}

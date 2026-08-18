import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";
import { rateLimitCallbackBot, rateLimitCallbackIp } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { phonePlaceholderEmail, toE164 } from "@/lib/phone-number";
import { sendCallbackNotificationToOwner } from "@/lib/booking-emails";
import { fireWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";
import { sendNewLeadNotification } from "@/lib/push-notifications";
import { getLogger } from "@/lib/logger";
import { safeHttpUrlForDisplay } from "@/lib/url-safety";

const log = getLogger("widget-callback");

const bodySchema = z.object({
  countryCode: z.string().min(1).max(4),
  phone: z.string().min(4).max(24),
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
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400, headers: cors });
    }

    const e164 = toE164(parsed.data.countryCode, parsed.data.phone);
    if (!e164) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400, headers: cors });
    }

    const ip = getClientIp(req);
    const [ipLimit, botLimit] = await Promise.all([
      rateLimitCallbackIp(ip),
      rateLimitCallbackBot(botId),
    ]);
    if (!ipLimit.ok || !botLimit.ok) {
      const retryAfter = Math.max(ipLimit.ok ? 0 : ipLimit.retryAfter, botLimit.ok ? 0 : botLimit.retryAfter);
      return NextResponse.json(
        { error: "Too many call requests. Try again later." },
        { status: 429, headers: { ...cors, "Retry-After": String(retryAfter) } },
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: {
        user: { select: { email: true } },
        phoneConfig: { select: { e164Number: true } },
      },
    });
    if (!bot) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404, headers: cors });
    }

    if (bot.phoneConfig?.e164Number && bot.phoneConfig.e164Number === e164) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400, headers: cors });
    }

    const pageUrl = safeHttpUrlForDisplay(parsed.data.pageUrl);
    const email = phonePlaceholderEmail(e164);
    const existing = await prisma.lead.findFirst({
      where: { botId, OR: [{ phone: e164 }, { email }] },
    });
    const lead =
      existing ??
      (await prisma.lead.create({
        data: {
          botId,
          email,
          phone: e164,
          sessionId: parsed.data.sessionId ?? null,
          pageUrl,
          source: "callback",
        },
      }));
    if (existing && !existing.phone) {
      await prisma.lead.update({ where: { id: existing.id }, data: { phone: e164 } });
    }

    // Do not place outbound Vapi calls from this unauthenticated public route.
    // Visitors call in via click-to-call; this path only queues a callback lead.
    if (!existing) {
      if (bot.user.email) {
        void sendCallbackNotificationToOwner({
          ownerEmail: bot.user.email,
          botName: bot.name,
          phone: e164,
          mode: "queued",
          pageUrl,
        });
      }
      void sendNewLeadNotification(bot.userId, { email: lead.email, name: undefined });
      void fireWebhooks(bot.userId, "lead.created", {
        leadId: lead.id,
        botId,
        botName: bot.name,
        email: lead.email,
        phone: e164,
        source: "callback",
        mode: "queued",
      });
      void logAudit({
        userId: bot.userId,
        action: "lead.captured",
        resourceType: "lead",
        resourceId: lead.id,
        meta: { botId, source: "callback", mode: "queued", phone: e164 },
        ip,
      });
    }

    return NextResponse.json({ ok: true, mode: "queued" }, { headers: cors });
  } catch (e) {
    log.error("callback route error", e);
    return NextResponse.json({ error: "Could not request a call. Try again." }, { status: 500, headers: cors });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { rateLimitChat } from "@/lib/rate-limit";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";

const bodySchema = z.object({
  botId: z.string().min(1),
  email: z.string().email(),
});

function clientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function OPTIONS(req: NextRequest) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or assistant" }, { status: 400, headers: cors });
    }

    const { botId, email } = parsed.data;
    const ip = clientIp(req);
    const limit = await rateLimitChat(`lead:${ip}:${botId}`);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { ...cors, "Retry-After": String(limit.retryAfter) } }
      );
    }

    const bot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!bot) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404, headers: cors });
    }

    const normEmail = email.toLowerCase().trim();

    // Deduplicate: don't create a new lead if this email already exists for this bot.
    const existing = await prisma.lead.findFirst({
      where: { botId, email: normEmail },
    });

    const lead = existing ?? await prisma.lead.create({
      data: {
        botId,
        email: normEmail,
        source: "widget",
      },
    });

    if (existing) {
      // Already captured — return success without duplicate audit entry.
      return NextResponse.json({ ok: true }, { headers: cors });
    }

    await logAudit({
      userId: bot.userId,
      action: "lead.captured",
      resourceType: "lead",
      resourceId: lead.id,
      meta: { botId, email: lead.email },
      ip,
    });

    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: cors });
  }
}

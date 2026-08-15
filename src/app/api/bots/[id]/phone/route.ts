import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { isVapiConfigured } from "@/lib/vapi";
import {
  assignPhoneNumberForBot,
  disablePhoneForBot,
  releasePhoneForBot,
  syncPhoneAssistantForBot,
} from "@/lib/phone-lifecycle";
import { rateLimitAuth } from "@/lib/rate-limit";
import { subscriptionIsActive } from "@/lib/plan";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  greeting: z.string().max(2000).nullable().optional(),
  voice: z.string().max(120).nullable().optional(),
  forwardingNumber: z.string().max(32).nullable().optional(),
  businessHoursOnly: z.boolean().optional(),
  areaCode: z.string().regex(/^\d{3}$/).optional(),
  action: z.enum(["sync", "assign_number", "disable", "release"]).optional(),
});

function requireActiveSubscription(appUser: { plan: string; subscriptionStatus: string | null }) {
  if (!subscriptionIsActive(appUser.plan, appUser.subscriptionStatus)) {
    return NextResponse.json(
      { error: "An active subscription is required for phone answering." },
      { status: 402 },
    );
  }
  return null;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paywall = requireActiveSubscription(appUser);
  if (paywall) return paywall;

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = await prisma.phoneConfig.findUnique({ where: { botId: id } });
  const booking = await prisma.bookingConfig.findUnique({
    where: { botId: id },
    select: { enabled: true },
  });

  return NextResponse.json({
    config,
    bookingEnabled: Boolean(booking?.enabled),
    platformReady: isVapiConfigured(),
  });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paywall = requireActiveSubscription(appUser);
  if (paywall) return paywall;

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { action, areaCode, enabled, greeting, voice, forwardingNumber, businessHoursOnly } =
    parsed.data;

  // Use Redis-backed 3/hour preset (not the memory-only 20/hour path).
  const rl = await rateLimitAuth(`phone:${appUser.id}`, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many phone setup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Persist settings first
  const settings = {
    ...(greeting !== undefined ? { greeting } : {}),
    ...(voice !== undefined ? { voice } : {}),
    ...(forwardingNumber !== undefined ? { forwardingNumber } : {}),
    ...(businessHoursOnly !== undefined ? { businessHoursOnly } : {}),
  };

  await prisma.phoneConfig.upsert({
    where: { botId: id },
    create: {
      botId: id,
      enabled: false,
      ...settings,
    },
    update: settings,
  });

  try {
    if (action === "sync" || (enabled === true && action !== "disable" && action !== "release")) {
      if (!isVapiConfigured()) {
        return NextResponse.json(
          {
            error:
              "Phone answering is not configured on this server (missing VAPI_API_KEY). Contact support.",
          },
          { status: 503 },
        );
      }
      await syncPhoneAssistantForBot(id);
      if (action === "assign_number" || (enabled === true && action !== "sync")) {
        // Assign number when enabling live if they don't have one yet
        const cfg = await prisma.phoneConfig.findUnique({ where: { botId: id } });
        if (!cfg?.e164Number || action === "assign_number") {
          await assignPhoneNumberForBot(id, areaCode);
        }
      }
    }

    if (action === "assign_number") {
      if (!isVapiConfigured()) {
        return NextResponse.json({ error: "VAPI_API_KEY is not configured" }, { status: 503 });
      }
      await syncPhoneAssistantForBot(id);
      await assignPhoneNumberForBot(id, areaCode);
    }

    if (action === "disable" || enabled === false) {
      await disablePhoneForBot(id);
    }

    if (action === "release") {
      await releasePhoneForBot(id);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Phone setup failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const config = await prisma.phoneConfig.findUnique({ where: { botId: id } });
  return NextResponse.json({
    config,
    platformReady: isVapiConfigured(),
  });
}

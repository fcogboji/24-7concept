import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canUserCreateBot, FREE_MAX_ASSISTANTS } from "@/lib/plan";
import { assertUrlSafeForServerFetch } from "@/lib/url-safety";
import { rateLimitBotCreate } from "@/lib/rate-limit";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bots = await prisma.bot.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      createdAt: true,
      _count: { select: { sources: true, messages: true } },
    },
  });

  return NextResponse.json({ bots });
}

export async function POST(req: Request) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const allowed = await canUserCreateBot(appUser.id);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Free plan allows up to ${FREE_MAX_ASSISTANTS} assistants. Upgrade to Pro for more.`,
      },
      { status: 402 }
    );
  }

  const createLimit = await rateLimitBotCreate(appUser.id);
  if (!createLimit.ok) {
    return NextResponse.json(
      { error: "Too many assistant creations. Try again later." },
      { status: 429, headers: { "Retry-After": String(createLimit.retryAfter) } }
    );
  }

  const url =
    parsed.data.websiteUrl && parsed.data.websiteUrl.length > 0
      ? parsed.data.websiteUrl
      : null;

  if (url) {
    try {
      assertUrlSafeForServerFetch(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid URL";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const bot = await prisma.bot.create({
    data: {
      userId: appUser.id,
      name: parsed.data.name,
      websiteUrl: url,
    },
  });

  await logAudit({
    userId: appUser.id,
    action: "bot.created",
    resourceType: "bot",
    resourceId: bot.id,
    meta: { name: bot.name, websiteUrl: url },
  });

  return NextResponse.json({ bot });
}

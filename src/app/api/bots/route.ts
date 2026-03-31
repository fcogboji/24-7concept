import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canUserCreateBot, FREE_MAX_ASSISTANTS } from "@/lib/plan";
import { assertUrlSafeForServerFetch } from "@/lib/url-safety";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bots = await prisma.bot.findMany({
    where: { userId: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const allowed = await canUserCreateBot(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Free plan allows up to ${FREE_MAX_ASSISTANTS} assistants. Upgrade to Pro for more.`,
      },
      { status: 402 }
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
      userId: session.user.id,
      name: parsed.data.name,
      websiteUrl: url,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "bot.created",
    resourceType: "bot",
    resourceId: bot.id,
    meta: { name: bot.name, websiteUrl: url },
  });

  return NextResponse.json({ bot });
}

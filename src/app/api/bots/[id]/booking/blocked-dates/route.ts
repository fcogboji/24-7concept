import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = await prisma.bookingConfig.findUnique({ where: { botId: id } });
  if (!config) return NextResponse.json({ blockedDates: [] });

  const blockedDates = await prisma.blockedDate.findMany({
    where: { bookingConfigId: config.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ blockedDates });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const config = await prisma.bookingConfig.upsert({
    where: { botId: id },
    create: { botId: id },
    update: {},
  });

  const blockedDate = await prisma.blockedDate.create({
    data: {
      bookingConfigId: config.id,
      date: new Date(parsed.data.date + "T00:00:00Z"),
      reason: parsed.data.reason || null,
    },
  });

  return NextResponse.json({ blockedDate }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  timezone: z.string().min(1).max(100).optional(),
  slotDurationMin: z.number().int().min(5).max(480).optional(),
  bufferMin: z.number().int().min(0).max(120).optional(),
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
  weeklyHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .optional(),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = await prisma.bookingConfig.findUnique({
    where: { botId: id },
    include: { weeklyHours: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }, services: { orderBy: { sortOrder: "asc" } }, blockedDates: { orderBy: { date: "asc" } } },
  });

  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { weeklyHours, ...settings } = parsed.data;

  const config = await prisma.bookingConfig.upsert({
    where: { botId: id },
    create: { botId: id, ...settings },
    update: settings,
  });

  // Replace weekly hours if provided
  if (weeklyHours) {
    await prisma.weeklyHours.deleteMany({ where: { bookingConfigId: config.id } });
    if (weeklyHours.length > 0) {
      await prisma.weeklyHours.createMany({
        data: weeklyHours.map((wh) => ({
          bookingConfigId: config.id,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
        })),
      });
    }
  }

  const updated = await prisma.bookingConfig.findUnique({
    where: { id: config.id },
    include: { weeklyHours: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } },
  });

  return NextResponse.json({ config: updated });
}

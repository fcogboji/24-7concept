import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(200),
  durationMin: z.number().int().min(5).max(480),
  description: z.string().max(2000).optional(),
  price: z.string().max(100).optional(),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = await prisma.bookingConfig.findUnique({ where: { botId: id } });
  if (!config) return NextResponse.json({ services: [] });

  const services = await prisma.service.findMany({
    where: { bookingConfigId: config.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ services });
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

  // Ensure booking config exists
  const config = await prisma.bookingConfig.upsert({
    where: { botId: id },
    create: { botId: id },
    update: {},
  });

  const count = await prisma.service.count({ where: { bookingConfigId: config.id } });

  const service = await prisma.service.create({
    data: {
      bookingConfigId: config.id,
      name: parsed.data.name,
      durationMin: parsed.data.durationMin,
      description: parsed.data.description || null,
      price: parsed.data.price || null,
      sortOrder: count,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}

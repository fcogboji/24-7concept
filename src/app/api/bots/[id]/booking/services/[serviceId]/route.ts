import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

type RouteContext = { params: Promise<{ id: string; serviceId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.string().max(100).nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, serviceId } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const service = await prisma.service.findFirst({
    where: { id: serviceId, bookingConfig: { botId: id } },
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: parsed.data,
  });

  return NextResponse.json({ service: updated });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, serviceId } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const service = await prisma.service.findFirst({
    where: { id: serviceId, bookingConfig: { botId: id } },
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  await prisma.service.delete({ where: { id: serviceId } });

  return NextResponse.json({ ok: true });
}

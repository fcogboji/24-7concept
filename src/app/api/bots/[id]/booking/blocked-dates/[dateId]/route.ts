import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

type RouteContext = { params: Promise<{ id: string; dateId: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, dateId } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bd = await prisma.blockedDate.findFirst({
    where: { id: dateId, bookingConfig: { botId: id } },
  });
  if (!bd) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.blockedDate.delete({ where: { id: dateId } });

  return NextResponse.json({ ok: true });
}

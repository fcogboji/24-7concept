import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const appointments = await prisma.appointment.findMany({
    where: {
      botId: id,
      ...(status ? { status } : {}),
    },
    include: { service: { select: { name: true } } },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return NextResponse.json({ appointments });
}

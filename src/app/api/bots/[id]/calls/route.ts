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
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") ?? 40)));
  const cursor = url.searchParams.get("cursor");

  const calls = await prisma.callSession.findMany({
    where: { botId: id },
    orderBy: { startedAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      vapiCallId: true,
      fromNumber: true,
      toNumber: true,
      status: true,
      startedAt: true,
      endedAt: true,
      durationSec: true,
      summary: true,
      leadId: true,
      appointmentId: true,
    },
  });

  return NextResponse.json({ calls });
}

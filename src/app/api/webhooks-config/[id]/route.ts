import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const hook = await prisma.webhook.findUnique({ where: { id } });
  if (!hook || hook.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

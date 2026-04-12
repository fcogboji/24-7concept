import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  url: z.string().url().max(2000),
  label: z.string().max(100).optional(),
  events: z.string().min(1).max(200).default("lead.created,appointment.created"),
});

export async function GET() {
  const user = await getOrCreateAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hooks = await prisma.webhook.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ hooks });
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const hook = await prisma.webhook.create({
    data: {
      userId: user.id,
      url: parsed.data.url,
      label: parsed.data.label ?? null,
      events: parsed.data.events,
    },
  });
  return NextResponse.json({ hook });
}

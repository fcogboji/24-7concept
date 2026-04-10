import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string; apptId: string }> };

const updateSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, apptId } = await context.params;
  const bot = await prisma.bot.findFirst({ where: { id, userId: appUser.id } });
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const appointment = await prisma.appointment.findFirst({
    where: { id: apptId, botId: id },
  });
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  const updated = await prisma.appointment.update({
    where: { id: apptId },
    data: { status: parsed.data.status },
  });

  void logAudit({
    userId: appUser.id,
    action: `appointment.${parsed.data.status}`,
    resourceType: "appointment",
    resourceId: apptId,
    meta: { previousStatus: appointment.status },
  });

  return NextResponse.json({ appointment: updated });
}

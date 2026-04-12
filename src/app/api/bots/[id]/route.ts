import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { assertUrlSafeForServerFetch, isLocalTrainingUrlAllowed } from "@/lib/url-safety";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  websiteUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  avatarUrl: z.union([z.string().url().max(2048), z.literal(""), z.null()]).optional(),
  businessInfo: z.union([z.string().max(12000), z.literal(""), z.null()]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const bot = await prisma.bot.findFirst({
    where: { id, userId: appUser.id },
  });
  if (!bot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { name?: string; websiteUrl?: string | null; avatarUrl?: string | null; businessInfo?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.avatarUrl !== undefined) {
    const v = parsed.data.avatarUrl;
    data.avatarUrl = v === "" || v === null ? null : v;
  }
  if (parsed.data.websiteUrl !== undefined) {
    data.websiteUrl =
      parsed.data.websiteUrl === "" || parsed.data.websiteUrl === null
        ? null
        : parsed.data.websiteUrl;
    if (data.websiteUrl) {
      try {
        assertUrlSafeForServerFetch(data.websiteUrl, {
          allowLocalhost: isLocalTrainingUrlAllowed(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid URL";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
  }
  if (parsed.data.businessInfo !== undefined) {
    const text = parsed.data.businessInfo;
    data.businessInfo = text === "" || text === null ? null : text.trim();
  }

  const updated = await prisma.bot.update({
    where: { id },
    data,
  });

  return NextResponse.json({ bot: updated });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const bot = await prisma.bot.findFirst({
    where: { id, userId: appUser.id },
  });
  if (!bot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (bot.isDemo) {
    return NextResponse.json(
      { error: "This assistant cannot be deleted." },
      { status: 403 }
    );
  }

  await prisma.bot.delete({ where: { id } });
  await logAudit({
    userId: appUser.id,
    action: "bot.deleted",
    resourceType: "bot",
    resourceId: id,
    meta: { name: bot.name },
  });

  return NextResponse.json({ ok: true });
}

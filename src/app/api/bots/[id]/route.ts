import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertUrlSafeForServerFetch } from "@/lib/url-safety";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  websiteUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const bot = await prisma.bot.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!bot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { name?: string; websiteUrl?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.websiteUrl !== undefined) {
    data.websiteUrl =
      parsed.data.websiteUrl === "" || parsed.data.websiteUrl === null
        ? null
        : parsed.data.websiteUrl;
    if (data.websiteUrl) {
      try {
        assertUrlSafeForServerFetch(data.websiteUrl);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid URL";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
  }

  const updated = await prisma.bot.update({
    where: { id },
    data,
  });

  return NextResponse.json({ bot: updated });
}

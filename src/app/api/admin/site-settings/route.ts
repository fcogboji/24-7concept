import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-ip";
import { rateLimitAuth } from "@/lib/rate-limit";
import {
  getDemoVideo,
  parseVideoUrl,
  setSiteSetting,
  SITE_SETTING_KEYS,
} from "@/lib/site-settings";

const bodySchema = z.object({
  demoVideoUrl: z.string().trim().max(500),
  demoVideoLabel: z.string().trim().max(120).optional(),
});

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { video, label } = await getDemoVideo();
  return NextResponse.json({ url: video?.url ?? "", embedUrl: video?.embedUrl ?? null, label });
}

export async function PUT(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const limit = await rateLimitAuth(`admin:site-settings:${admin.clerkUserId}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { demoVideoUrl, demoVideoLabel } = parsed.data;

  if (demoVideoUrl) {
    const video = parseVideoUrl(demoVideoUrl);
    if (!video) {
      return NextResponse.json(
        { error: "Paste a YouTube, Vimeo, or Loom share link (https)." },
        { status: 400 },
      );
    }
    await setSiteSetting(SITE_SETTING_KEYS.demoVideoUrl, video.url);
  } else {
    await setSiteSetting(SITE_SETTING_KEYS.demoVideoUrl, "");
  }

  await setSiteSetting(SITE_SETTING_KEYS.demoVideoLabel, demoVideoLabel ?? "");

  await logAudit({
    actorClerkId: admin.clerkUserId,
    actorEmail: admin.email,
    action: demoVideoUrl ? "admin.landing.demo_video_set" : "admin.landing.demo_video_cleared",
    resourceType: "site_setting",
    resourceId: SITE_SETTING_KEYS.demoVideoUrl,
    meta: { url: demoVideoUrl || null },
    ip,
  });

  const { video, label } = await getDemoVideo();
  return NextResponse.json({ ok: true, url: video?.url ?? "", label });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { assertUrlSafeForServerFetch, isLocalTrainingUrlAllowed } from "@/lib/url-safety";
import { generateWebhookSecret, wrapSecretForStorage } from "@/lib/webhooks";

const createSchema = z.object({
  url: z.string().url().max(2000),
  label: z.string().max(100).optional(),
  events: z.string().min(1).max(200).default("lead.created,appointment.created"),
});

export async function GET() {
  const user = await getOrCreateAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hooks = await prisma.webhook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, label: true, events: true, active: true, createdAt: true },
  });
  return NextResponse.json({ hooks });
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    assertUrlSafeForServerFetch(parsed.data.url, { allowLocalhost: isLocalTrainingUrlAllowed() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid URL" }, { status: 400 });
  }

  // Generate the plaintext secret to show the customer once; store the
  // encrypted form so a DB dump cannot impersonate their webhook signatures.
  const secret = generateWebhookSecret();
  const hook = await prisma.webhook.create({
    data: {
      userId: user.id,
      url: parsed.data.url,
      label: parsed.data.label ?? null,
      events: parsed.data.events,
      secret: wrapSecretForStorage(secret),
    },
  });
  return NextResponse.json({
    hook: { id: hook.id, url: hook.url, label: hook.label, events: hook.events, active: hook.active },
    secret,
  });
}

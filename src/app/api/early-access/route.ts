import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitChat } from "@/lib/rate-limit";
import { getLogger } from "@/lib/logger";

const log = getLogger("early-access");

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
  features: z
    .array(z.enum(["phone", "whatsapp"]))
    .min(1)
    .max(2)
    .transform((values) => [...new Set(values)]),
  // Honeypot: browsers leave this empty; basic form bots often fill it.
  companyWebsite: z.string().max(0).optional(),
});

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and select a feature." }, { status: 400 });
    }

    const limit = await rateLimitChat(`early-access:${clientIp(req)}`);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const email = parsed.data.email.toLowerCase();
    await prisma.$transaction(
      parsed.data.features.map((feature) =>
        prisma.productInterest.upsert({
          where: { email_feature: { email, feature } },
          create: { email, feature },
          update: {},
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("early access signup failed", error);
    return NextResponse.json(
      { error: "We couldn't save your interest right now. Please try again." },
      { status: 500 },
    );
  }
}

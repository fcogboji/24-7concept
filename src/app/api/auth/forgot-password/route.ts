import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken } from "@/lib/auth-tokens";
import { isEmailConfigured, sendTransactionalEmail, shouldSkipEmailAndAutoVerify } from "@/lib/email";
import { rateLimitAuth } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = await rateLimitAuth(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    // Same response whether or not the user exists (avoid email enumeration)
    const generic = { ok: true as const };

    if (!user) {
      return NextResponse.json(generic);
    }

    if (shouldSkipEmailAndAutoVerify()) {
      const raw = await createAuthToken(user.id, "password_reset");
      const resetUrl = `${appOrigin()}/reset-password?token=${encodeURIComponent(raw)}`;
      console.warn(`[email disabled] Password reset link for ${user.email}: ${resetUrl}`);
      return NextResponse.json(generic);
    }

    if (!isEmailConfigured()) {
      console.warn("[forgot-password] email not configured, user:", user.email);
      return NextResponse.json(generic);
    }

    const raw = await createAuthToken(user.id, "password_reset");
    const resetUrl = `${appOrigin()}/reset-password?token=${encodeURIComponent(raw)}`;

    try {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Reset your 24/7concept password",
        html: `<p>Hi${user.name ? ` ${user.name}` : ""},</p>
<p>We received a request to reset your password. Open this link to choose a new one:</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p>This link expires in one hour.</p>
<p>If you did not ask for this, you can ignore this email.</p>`,
      });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Could not send email. Try again later." }, { status: 500 });
    }

    return NextResponse.json(generic);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

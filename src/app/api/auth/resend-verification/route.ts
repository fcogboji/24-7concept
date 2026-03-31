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
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  const emailKey = parsed.success ? parsed.data.email.toLowerCase() : "invalid";

  const limit = await rateLimitAuth(`resend:${ip}:${emailKey}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({ ok: true });
    }

    if (shouldSkipEmailAndAutoVerify()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Email is not configured on this server." }, { status: 503 });
    }

    const raw = await createAuthToken(user.id, "email_verify");
    const verifyUrl = `${appOrigin()}/verify-email?token=${encodeURIComponent(raw)}`;

    await sendTransactionalEmail({
      to: user.email,
      subject: "Verify your 24/7concept account",
      html: `<p>Hi${user.name ? ` ${user.name}` : ""},</p>
<p>Confirm your email to use 24/7concept:</p>
<p><a href="${verifyUrl}">Verify email address</a></p>
<p>This link expires in 48 hours.</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not send email" }, { status: 500 });
  }
}

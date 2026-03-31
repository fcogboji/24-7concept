import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAuthToken } from "@/lib/auth-tokens";
import { isEmailConfigured, sendTransactionalEmail, shouldSkipEmailAndAutoVerify } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { rateLimitAuth } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
});

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const regLimit = await rateLimitAuth(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!regLimit.ok) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(regLimit.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const autoVerify = shouldSkipEmailAndAutoVerify();
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name,
        emailVerifiedAt: autoVerify ? new Date() : null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "user.registered",
      resourceType: "user",
      resourceId: user.id,
      meta: { email: user.email, emailVerified: autoVerify },
      ip: ip || undefined,
    });

    if (autoVerify) {
      return NextResponse.json({ ok: true, needsVerification: false });
    }

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV === "production") {
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json(
          {
            error:
              "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM, or contact support.",
          },
          { status: 503 }
        );
      }
    }

    const raw = await createAuthToken(user.id, "email_verify");
    const verifyUrl = `${appOrigin()}/verify-email?token=${encodeURIComponent(raw)}`;

    let sendResult: Awaited<ReturnType<typeof sendTransactionalEmail>>;
    try {
      sendResult = await sendTransactionalEmail({
        to: user.email,
        subject: "Verify your 24/7concept account",
        html: `<p>Hi${user.name ? ` ${user.name}` : ""},</p>
<p>Confirm your email to start using 24/7concept:</p>
<p><a href="${verifyUrl}">Verify email address</a></p>
<p>This link expires in 48 hours.</p>
<p>If you did not create an account, you can ignore this message.</p>`,
      });
    } catch (e) {
      console.error(e);
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: "Could not send verification email. Try again or contact support." },
        { status: 500 }
      );
    }

    if ("skipped" in sendResult) {
      await prisma.authToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
      return NextResponse.json({ ok: true, needsVerification: false });
    }

    return NextResponse.json({ ok: true, needsVerification: true });
  } catch {
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}

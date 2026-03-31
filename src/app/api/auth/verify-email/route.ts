import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const row = await consumeAuthToken(parsed.data.token, "email_verify");
    if (!row) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.authToken.deleteMany({ where: { userId: row.userId } }),
      prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not verify email" }, { status: 500 });
  }
}

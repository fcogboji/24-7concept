import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { rateLimitAuth } from "@/lib/rate-limit";

const bodySchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimitAuth(`followup:${appUser.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many follow-up emails. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { bot: { select: { userId: true, name: true } } },
  });

  if (!lead || lead.bot.userId !== appUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subject or message" }, { status: 400 });
  }

  const { subject, message } = parsed.data;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi${lead.name ? ` ${escapeHtml(lead.name)}` : ""},</p>
      <div style="white-space: pre-wrap;">${escapeHtml(message)}</div>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="font-size: 13px; color: #888;">This email was sent by ${escapeHtml(lead.bot.name)} via faztino.</p>
    </div>
  `;

  try {
    await sendTransactionalEmail({ to: lead.email, subject, html });
  } catch {
    return NextResponse.json({ error: "Failed to send email. Check email configuration." }, { status: 500 });
  }

  await prisma.lead.update({
    where: { id },
    data: { status: "followed_up" },
  });

  await logAudit({
    userId: appUser.id,
    action: "lead.followed_up",
    resourceType: "lead",
    resourceId: lead.id,
    meta: { email: lead.email, subject },
  });

  return NextResponse.json({ ok: true });
}

import { Resend } from "resend";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/**
 * Outside production, if Resend is not configured we skip sending mail and auto-verify / log reset links
 * so local and preview environments stay usable.
 */
export function shouldSkipEmailAndAutoVerify(): boolean {
  if (isEmailConfigured()) return false;
  return process.env.NODE_ENV !== "production";
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: true } | { skipped: true }> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email] skipped (no RESEND): ${opts.subject} → ${opts.to}`);
      return { skipped: true };
    }
    throw new Error("Transactional email is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(error.message ?? "Failed to send email");
  }

  return { sent: true };
}

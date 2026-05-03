import { Resend } from "resend";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/**
 * True if EMAIL_FROM is the Resend shared sandbox sender. That address only
 * delivers to the Resend account owner, so any production deployment using it
 * will silently fail to deliver to customers.
 */
export function isUsingResendSandboxSender(): boolean {
  const from = process.env.EMAIL_FROM ?? "";
  return /onboarding@resend\.dev/i.test(from);
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

  if (process.env.NODE_ENV === "production" && isUsingResendSandboxSender()) {
    // Loud failure rather than silent drop — onboarding@resend.dev only
    // delivers to the Resend account owner, never to real customers.
    console.error(
      "[email] EMAIL_FROM is the Resend sandbox sender (onboarding@resend.dev). Verify a domain in Resend and set EMAIL_FROM to an address on it before going live.",
    );
    throw new Error(
      "EMAIL_FROM is the Resend sandbox sender. Configure a verified domain in Resend before sending production email.",
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error(`[email] Resend send failed → to=${opts.to} subject=${opts.subject}`, error);
    throw new Error(error.message ?? "Failed to send email");
  }

  return { sent: true };
}

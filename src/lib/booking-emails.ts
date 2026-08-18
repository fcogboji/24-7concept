import { sendTransactionalEmail } from "@/lib/email";
import { safeHttpUrlForDisplay } from "@/lib/url-safety";

function pageUrlRow(pageUrl?: string | null): string {
  const safe = safeHttpUrlForDisplay(pageUrl);
  if (!safe) return "";
  return `<tr><td style="padding:6px 0;color:#888">Page</td><td style="padding:6px 0"><a href="${esc(safe)}">${esc(safe)}</a></td></tr>`;
}

export async function sendBookingNotificationToOwner(params: {
  ownerEmail: string;
  botName: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string | null;
  serviceName: string | null;
  dateTime: string;
}): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: params.ownerEmail,
      subject: `New appointment booked — ${params.botName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0d9488;margin:0 0 16px">New Appointment</h2>
          <p style="margin:0 0 12px;color:#444">A visitor booked an appointment through <strong>${esc(params.botName)}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#888">Name</td><td style="padding:6px 0">${esc(params.visitorName)}</td></tr>
            <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0"><a href="mailto:${esc(params.visitorEmail)}">${esc(params.visitorEmail)}</a></td></tr>
            ${params.visitorPhone ? `<tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0">${esc(params.visitorPhone)}</td></tr>` : ""}
            ${params.serviceName ? `<tr><td style="padding:6px 0;color:#888">Service</td><td style="padding:6px 0">${esc(params.serviceName)}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#888">Date & Time</td><td style="padding:6px 0"><strong>${esc(params.dateTime)}</strong></td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#999">You can manage appointments from your faztino dashboard.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[booking-email] Failed to notify owner:", e);
  }
}

export async function sendBookingConfirmationToVisitor(params: {
  visitorEmail: string;
  visitorName: string;
  botName: string;
  serviceName: string | null;
  dateTime: string;
}): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: params.visitorEmail,
      subject: `Appointment confirmed — ${params.botName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0d9488;margin:0 0 16px">Appointment Confirmed</h2>
          <p style="margin:0 0 12px;color:#444">Hi ${esc(params.visitorName)}, your appointment with <strong>${esc(params.botName)}</strong> is confirmed.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${params.serviceName ? `<tr><td style="padding:6px 0;color:#888">Service</td><td style="padding:6px 0">${esc(params.serviceName)}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#888">Date & Time</td><td style="padding:6px 0"><strong>${esc(params.dateTime)}</strong></td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#444">If you need to change or cancel, please contact the business directly.</p>
          <p style="margin:12px 0 0;font-size:12px;color:#999">Powered by faztino</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[booking-email] Failed to confirm to visitor:", e);
  }
}

export async function sendLeadNotificationToOwner(params: {
  ownerEmail: string;
  botName: string;
  leadEmail: string;
  leadName?: string | null;
  leadPhone?: string | null;
  pageUrl?: string | null;
}): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: params.ownerEmail,
      subject: `New lead captured — ${params.botName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0d9488;margin:0 0 16px">New Lead</h2>
          <p style="margin:0 0 12px;color:#444">A visitor shared their details through <strong>${esc(params.botName)}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${params.leadName ? `<tr><td style="padding:6px 0;color:#888">Name</td><td style="padding:6px 0">${esc(params.leadName)}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0"><a href="mailto:${esc(params.leadEmail)}">${esc(params.leadEmail)}</a></td></tr>
            ${params.leadPhone ? `<tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0">${esc(params.leadPhone)}</td></tr>` : ""}
            ${pageUrlRow(params.pageUrl)}
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#999">Follow up quickly — leads contacted within 5 minutes convert ~9× more often.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[lead-email] Failed to notify owner:", e);
  }
}

export async function sendCallbackNotificationToOwner(params: {
  ownerEmail: string;
  botName: string;
  phone: string;
  mode: "calling" | "queued";
  pageUrl?: string | null;
}): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: params.ownerEmail,
      subject:
        params.mode === "calling"
          ? `AI is calling a visitor — ${params.botName}`
          : `Callback requested — ${params.botName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1C7C4A;margin:0 0 16px">${params.mode === "calling" ? "Outbound call started" : "Callback requested"}</h2>
          <p style="margin:0 0 12px;color:#444">A visitor asked your AI to call them from the <strong>${esc(params.botName)}</strong> widget.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0">${esc(params.phone)}</td></tr>
            ${pageUrlRow(params.pageUrl)}
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#999">${
            params.mode === "calling"
              ? "The AI is placing the call now. Check Calls in your dashboard when it finishes."
              : "Phone answering is not live yet — call this visitor back yourself."
          }</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[callback-email] Failed to notify owner:", e);
  }
}

export async function sendHandoffNotificationToOwner(params: {
  ownerEmail: string;
  botName: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message: string;
  pageUrl?: string | null;
}): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: params.ownerEmail,
      subject: `New contact from widget — ${params.botName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1C7C4A;margin:0 0 16px">Contact us</h2>
          <p style="margin:0 0 12px;color:#444">Someone used the widget on <strong>${esc(params.botName)}</strong> to reach your team.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${params.name ? `<tr><td style="padding:6px 0;color:#888">Name</td><td style="padding:6px 0">${esc(params.name)}</td></tr>` : ""}
            ${params.email ? `<tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0"><a href="mailto:${esc(params.email)}">${esc(params.email)}</a></td></tr>` : ""}
            ${params.phone ? `<tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0">${esc(params.phone)}</td></tr>` : ""}
            ${pageUrlRow(params.pageUrl)}
          </table>
          <p style="margin:16px 0 8px;color:#888;font-size:13px">Message</p>
          <p style="margin:0;color:#444;white-space:pre-wrap">${esc(params.message)}</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[handoff-email] Failed to notify owner:", e);
  }
}

export async function sendPhoneQuotaAlertToOwner(params: {
  ownerEmail: string;
  usedMinutes: number;
  limitMinutes: number;
  percent: number;
}): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: params.ownerEmail,
      subject:
        params.percent >= 100
          ? "AI phone minutes used up for this month"
          : "You've used 80% of this month's AI phone minutes",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1C7C4A;margin:0 0 16px">Phone usage</h2>
          <p style="margin:0 0 12px;color:#444">
            You've used <strong>${params.usedMinutes}</strong> of <strong>${params.limitMinutes}</strong> included AI phone minutes this month (${params.percent}%).
          </p>
          <p style="margin:0 0 12px;color:#444">
            ${
              params.percent >= 100
                ? "New AI calls are paused until next month so a busy line cannot run up an unexpected bill. Visitors can still chat, leave a callback request, or WhatsApp you."
                : "When you hit 100%, AI calls pause automatically. Chat, booking, and lead capture keep working."
            }
          </p>
          <p style="margin:16px 0 0;font-size:13px;color:#999">Need more minutes? Reply to this email or write hello@faztino.com — high-volume plans are quoted so they stay profitable for both of us.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[quota-email] Failed to notify owner:", e);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

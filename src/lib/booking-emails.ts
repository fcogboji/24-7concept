import { sendTransactionalEmail } from "@/lib/email";

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
          <p style="margin:16px 0 0;font-size:13px;color:#999">You can manage appointments from your 247concept dashboard.</p>
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
          <p style="margin:12px 0 0;font-size:12px;color:#999">Powered by 247concept</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[booking-email] Failed to confirm to visitor:", e);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

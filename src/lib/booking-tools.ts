import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots, businessTimeToUtc } from "@/lib/booking-availability";
import { sendBookingNotificationToOwner, sendBookingConfirmationToVisitor } from "@/lib/booking-emails";
import { logAudit } from "@/lib/audit";

/* ------------------------------------------------------------------ */
/*  OpenAI tool definitions                                           */
/* ------------------------------------------------------------------ */

export const bookingTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_services",
      description: "List the available services or appointment types the business offers for booking.",
      parameters: { type: "object" as const, properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available appointment time slots for a specific date.",
      parameters: {
        type: "object" as const,
        properties: {
          date: { type: "string" as const, description: "Date in YYYY-MM-DD format" },
          serviceId: { type: "string" as const, description: "Optional service ID to use its duration" },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description:
        "Book an appointment. Only call this after confirming all details (date, time, service, name, email) with the visitor.",
      parameters: {
        type: "object" as const,
        properties: {
          date: { type: "string" as const, description: "Date in YYYY-MM-DD format" },
          startTime: { type: "string" as const, description: "Start time HH:mm in the business timezone" },
          serviceId: { type: "string" as const, description: "Service ID if applicable" },
          name: { type: "string" as const, description: "Visitor full name" },
          email: { type: "string" as const, description: "Visitor email address" },
          phone: { type: "string" as const, description: "Visitor phone number (optional)" },
        },
        required: ["date", "startTime", "name", "email"],
      },
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Tool handlers                                                     */
/* ------------------------------------------------------------------ */

interface ToolContext {
  botId: string;
  sessionId?: string | null;
}

export async function handleBookingTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  switch (toolName) {
    case "list_services":
      return handleListServices(ctx.botId);
    case "check_availability":
      return handleCheckAvailability(ctx.botId, args as { date: string; serviceId?: string });
    case "create_appointment":
      return handleCreateAppointment(ctx.botId, args as unknown as CreateAppointmentArgs, ctx.sessionId);
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

/* -- list_services ------------------------------------------------- */

async function handleListServices(botId: string): Promise<string> {
  const config = await prisma.bookingConfig.findUnique({
    where: { botId },
    include: { services: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });

  if (!config?.services.length) {
    return JSON.stringify({ services: [], note: "No specific services configured. The business accepts general appointments." });
  }

  return JSON.stringify({
    services: config.services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      price: s.price || "Not specified",
      description: s.description || undefined,
    })),
  });
}

/* -- check_availability -------------------------------------------- */

async function handleCheckAvailability(
  botId: string,
  args: { date: string; serviceId?: string }
): Promise<string> {
  const config = await prisma.bookingConfig.findUnique({
    where: { botId },
    include: {
      weeklyHours: true,
      blockedDates: true,
      services: true,
    },
  });

  if (!config) return JSON.stringify({ error: "Booking is not configured." });

  // Determine slot duration
  let slotDuration = config.slotDurationMin;
  if (args.serviceId) {
    const svc = config.services.find((s) => s.id === args.serviceId);
    if (svc) slotDuration = svc.durationMin;
  }

  // Validate date
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(args.date)) {
    return JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." });
  }

  // Check max advance days
  const today = new Date();
  const requestedDate = new Date(args.date + "T00:00:00Z");
  const diffDays = Math.ceil((requestedDate.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) {
    return JSON.stringify({ error: "Cannot book in the past.", slots: [] });
  }
  if (diffDays > config.maxAdvanceDays) {
    return JSON.stringify({ error: `Bookings are only available up to ${config.maxAdvanceDays} days in advance.`, slots: [] });
  }

  // Get existing appointments for that date range (wide window to cover timezone edge cases)
  const dayStart = new Date(args.date + "T00:00:00Z");
  dayStart.setUTCHours(dayStart.getUTCHours() - 14); // cover all timezones
  const dayEnd = new Date(args.date + "T23:59:59Z");
  dayEnd.setUTCHours(dayEnd.getUTCHours() + 14);

  const existingAppts = await prisma.appointment.findMany({
    where: {
      botId,
      status: { not: "cancelled" },
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
    select: { startTime: true, endTime: true },
  });

  const slots = computeAvailableSlots({
    date: args.date,
    weeklyHours: config.weeklyHours,
    blockedDates: config.blockedDates,
    existingAppointments: existingAppts,
    slotDurationMin: slotDuration,
    bufferMin: config.bufferMin,
    timezone: config.timezone,
  });

  if (slots.length === 0) {
    return JSON.stringify({ date: args.date, slots: [], note: "No available slots on this date." });
  }

  return JSON.stringify({
    date: args.date,
    timezone: config.timezone,
    slotDurationMin: slotDuration,
    slots,
  });
}

/* -- create_appointment -------------------------------------------- */

interface CreateAppointmentArgs {
  date: string;
  startTime: string;
  serviceId?: string;
  name: string;
  email: string;
  phone?: string;
}

async function handleCreateAppointment(
  botId: string,
  args: CreateAppointmentArgs,
  sessionId?: string | null
): Promise<string> {
  const config = await prisma.bookingConfig.findUnique({
    where: { botId },
    include: { services: true },
  });

  if (!config) return JSON.stringify({ error: "Booking is not configured." });

  // Determine service and duration
  let serviceName: string | null = null;
  let durationMin = config.slotDurationMin;
  if (args.serviceId) {
    const svc = config.services.find((s) => s.id === args.serviceId);
    if (svc) {
      serviceName = svc.name;
      durationMin = svc.durationMin;
    }
  }

  // Convert to UTC
  const startUtc = businessTimeToUtc(args.date, args.startTime, config.timezone);
  const endUtc = new Date(startUtc.getTime() + durationMin * 60_000);

  // Check for overlapping appointments in a transaction
  const appointment = await prisma.$transaction(async (tx) => {
    const overlapping = await tx.appointment.findFirst({
      where: {
        botId,
        status: { not: "cancelled" },
        startTime: { lt: endUtc },
        endTime: { gt: startUtc },
      },
    });

    if (overlapping) return null;

    return tx.appointment.create({
      data: {
        botId,
        serviceId: args.serviceId || null,
        sessionId: sessionId || null,
        name: args.name.trim(),
        email: args.email.trim().toLowerCase(),
        phone: args.phone?.trim() || null,
        startTime: startUtc,
        endTime: endUtc,
        timezone: config.timezone,
        status: "confirmed",
      },
    });
  });

  if (!appointment) {
    return JSON.stringify({ error: "That time slot is no longer available. Please check availability again." });
  }

  // Format datetime for emails
  const dateTimeStr = formatDateTimeInTz(startUtc, config.timezone);

  // Fire-and-forget: send emails + audit log
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    include: { user: { select: { email: true } } },
  });

  if (bot) {
    void sendBookingNotificationToOwner({
      ownerEmail: bot.user.email,
      botName: bot.name,
      visitorName: args.name,
      visitorEmail: args.email,
      visitorPhone: args.phone,
      serviceName,
      dateTime: dateTimeStr,
    });

    void sendBookingConfirmationToVisitor({
      visitorEmail: args.email.trim().toLowerCase(),
      visitorName: args.name,
      botName: bot.name,
      serviceName,
      dateTime: dateTimeStr,
    });
  }

  void logAudit({
    userId: bot?.userId,
    action: "appointment.created",
    resourceType: "appointment",
    resourceId: appointment.id,
    meta: { name: args.name, email: args.email, service: serviceName, date: args.date, time: args.startTime },
  });

  return JSON.stringify({
    success: true,
    appointmentId: appointment.id,
    date: args.date,
    time: args.startTime,
    endTime: epochToHmInTz(endUtc.getTime(), config.timezone),
    service: serviceName,
    name: args.name,
    email: args.email,
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDateTimeInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function epochToHmInTz(epoch: number, tz: string): string {
  const d = new Date(epoch);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

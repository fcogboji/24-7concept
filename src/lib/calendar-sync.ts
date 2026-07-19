/**
 * Calendar sync utilities
 * Handles two-way sync between Faztino appointments and calendar events
 */

import { prisma } from "./prisma";
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "./google-calendar";
import {
  createMicrosoftCalendarEvent,
  updateMicrosoftCalendarEvent,
  deleteMicrosoftCalendarEvent,
} from "./microsoft-calendar";

/**
 * Sync an appointment to the user's calendar
 */
export async function syncAppointmentToCalendar(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      bot: { include: { user: true } },
      service: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Find active calendar connection for this user
  const connection = await prisma.calendarConnection.findFirst({
    where: {
      userId: appointment.bot.userId,
      active: true,
    },
    orderBy: { createdAt: "desc" }, // Use most recent connection
  });

  if (!connection) {
    // No calendar connected, skip sync
    return;
  }

  const calendarId = connection.calendarId || "primary";

  const eventData = {
    summary: `${appointment.name} - ${appointment.service?.name || "Appointment"}`,
    description: [
      `Customer: ${appointment.name}`,
      `Email: ${appointment.email}`,
      appointment.phone ? `Phone: ${appointment.phone}` : null,
      appointment.notes ? `Notes: ${appointment.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    timezone: appointment.timezone,
    attendees: [{ email: appointment.email, name: appointment.name }],
  };

  try {
    if (appointment.calendarEventId && appointment.calendarConnectionId === connection.id) {
      // Update existing event
      if (connection.provider === "google") {
        await updateGoogleCalendarEvent(
          connection.id,
          calendarId,
          appointment.calendarEventId,
          eventData
        );
      } else if (connection.provider === "microsoft") {
        await updateMicrosoftCalendarEvent(
          connection.id,
          calendarId,
          appointment.calendarEventId,
          eventData
        );
      }
    } else {
      // Create new event
      let eventId: string;
      if (connection.provider === "google") {
        eventId = await createGoogleCalendarEvent(connection.id, calendarId, eventData);
      } else if (connection.provider === "microsoft") {
        eventId = await createMicrosoftCalendarEvent(connection.id, calendarId, eventData);
      } else {
        throw new Error(`Unsupported calendar provider: ${connection.provider}`);
      }

      // Update appointment with calendar event ID
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          calendarEventId: eventId,
          calendarConnectionId: connection.id,
          calendarSyncedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Error syncing appointment to calendar:", error);
    // Don't throw - calendar sync failure shouldn't block appointment creation
  }
}

/**
 * Remove an appointment from the calendar
 */
export async function removeAppointmentFromCalendar(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment || !appointment.calendarEventId || !appointment.calendarConnectionId) {
    return;
  }

  const connection = await prisma.calendarConnection.findUnique({
    where: { id: appointment.calendarConnectionId },
  });

  if (!connection) {
    return;
  }

  const calendarId = connection.calendarId || "primary";

  try {
    if (connection.provider === "google") {
      await deleteGoogleCalendarEvent(connection.id, calendarId, appointment.calendarEventId);
    } else if (connection.provider === "microsoft") {
      await deleteMicrosoftCalendarEvent(
        connection.id,
        calendarId,
        appointment.calendarEventId
      );
    }
  } catch (error) {
    console.error("Error removing appointment from calendar:", error);
    // Don't throw - allow deletion even if calendar sync fails
  }
}

/**
 * Get the primary calendar connection for a user
 */
export async function getPrimaryCalendarConnection(userId: string) {
  return prisma.calendarConnection.findFirst({
    where: {
      userId,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Disconnect a calendar
 */
export async function disconnectCalendar(connectionId: string, userId: string) {
  const connection = await prisma.calendarConnection.findFirst({
    where: {
      id: connectionId,
      userId,
    },
  });

  if (!connection) {
    throw new Error("Calendar connection not found");
  }

  // Mark as inactive instead of deleting to preserve history
  await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: { active: false },
  });

  // Clear calendar references from appointments
  await prisma.appointment.updateMany({
    where: {
      calendarConnectionId: connectionId,
    },
    data: {
      calendarEventId: null,
      calendarConnectionId: null,
      calendarSyncedAt: null,
    },
  });
}

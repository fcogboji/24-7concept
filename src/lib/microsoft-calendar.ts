/**
 * Microsoft Calendar (Outlook) API integration
 * Handles OAuth, token refresh, and calendar operations
 */

import { prisma } from "./prisma";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_GRAPH_API = "https://graph.microsoft.com/v1.0";

export interface MicrosoftCalendarEvent {
  id: string;
  subject: string;
  body?: { content: string; contentType: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { emailAddress: { address: string; name?: string } }[];
}

/**
 * Get OAuth authorization URL
 */
export function getMicrosoftAuthUrl(userId: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error("MICROSOFT_CLIENT_ID not configured");
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/microsoft/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: ["Calendars.ReadWrite", "offline_access", "User.Read"].join(" "),
    state: userId, // Pass userId to identify who's connecting
    response_mode: "query",
  });

  return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeMicrosoftCode(code: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/microsoft/callback`;

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      scope: ["Calendars.ReadWrite", "offline_access", "User.Read"].join(" "),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }>;
}

/**
 * Refresh access token
 */
export async function refreshMicrosoftToken(refreshToken: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: ["Calendars.ReadWrite", "offline_access", "User.Read"].join(" "),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

/**
 * Get user's email from access token
 */
export async function getMicrosoftUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(`${MICROSOFT_GRAPH_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  const data = await response.json();
  return data.mail || data.userPrincipalName;
}

/**
 * Get valid access token for a calendar connection (refresh if needed)
 */
async function getValidAccessToken(connectionId: string): Promise<string> {
  const connection = await prisma.calendarConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error("Calendar connection not found");
  }

  // Check if token is expired or about to expire (5 min buffer)
  const now = new Date();
  const expiresAt = connection.tokenExpiresAt;
  const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (needsRefresh && connection.refreshToken) {
    const tokens = await refreshMicrosoftToken(connection.refreshToken);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Microsoft sometimes returns a new refresh token
    const updateData: { accessToken: string; tokenExpiresAt: Date; refreshToken?: string } = {
      accessToken: tokens.access_token,
      tokenExpiresAt: newExpiresAt,
    };
    if (tokens.refresh_token) {
      updateData.refreshToken = tokens.refresh_token;
    }

    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: updateData,
    });

    return tokens.access_token;
  }

  return connection.accessToken;
}

/**
 * List user's calendars
 */
export async function listMicrosoftCalendars(connectionId: string) {
  const accessToken = await getValidAccessToken(connectionId);

  const response = await fetch(`${MICROSOFT_GRAPH_API}/me/calendars`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to list calendars");
  }

  const data = await response.json();
  return data.value as {
    id: string;
    name: string;
    isDefaultCalendar?: boolean;
    canEdit?: boolean;
  }[];
}

/**
 * Create a calendar event
 */
export async function createMicrosoftCalendarEvent(
  connectionId: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendees?: { email: string; name?: string }[];
  }
): Promise<string> {
  const accessToken = await getValidAccessToken(connectionId);

  const eventData = {
    subject: event.summary,
    body: event.description
      ? {
          contentType: "Text",
          content: event.description,
        }
      : undefined,
    start: {
      dateTime: event.startTime.toISOString().slice(0, -1), // Remove Z
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime.toISOString().slice(0, -1), // Remove Z
      timeZone: event.timezone,
    },
    attendees: event.attendees?.map((a) => ({
      emailAddress: {
        address: a.email,
        name: a.name,
      },
      type: "required",
    })),
  };

  const url =
    calendarId === "primary"
      ? `${MICROSOFT_GRAPH_API}/me/calendar/events`
      : `${MICROSOFT_GRAPH_API}/me/calendars/${calendarId}/events`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create event: ${error}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Update a calendar event
 */
export async function updateMicrosoftCalendarEvent(
  connectionId: string,
  _calendarId: string,
  eventId: string,
  event: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendees?: { email: string; name?: string }[];
  }
): Promise<void> {
  const accessToken = await getValidAccessToken(connectionId);

  const eventData = {
    subject: event.summary,
    body: event.description
      ? {
          contentType: "Text",
          content: event.description,
        }
      : undefined,
    start: {
      dateTime: event.startTime.toISOString().slice(0, -1),
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime.toISOString().slice(0, -1),
      timeZone: event.timezone,
    },
    attendees: event.attendees?.map((a) => ({
      emailAddress: {
        address: a.email,
        name: a.name,
      },
      type: "required",
    })),
  };

  const response = await fetch(`${MICROSOFT_GRAPH_API}/me/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error("Failed to update event");
  }
}

/**
 * Delete a calendar event
 */
export async function deleteMicrosoftCalendarEvent(
  connectionId: string,
  _calendarId: string,
  eventId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(connectionId);

  const response = await fetch(`${MICROSOFT_GRAPH_API}/me/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete event");
  }
}

/**
 * Get events in a date range
 */
export async function getMicrosoftCalendarEvents(
  connectionId: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<MicrosoftCalendarEvent[]> {
  const accessToken = await getValidAccessToken(connectionId);

  const params = new URLSearchParams({
    startDateTime: timeMin.toISOString(),
    endDateTime: timeMax.toISOString(),
  });

  const url =
    calendarId === "primary"
      ? `${MICROSOFT_GRAPH_API}/me/calendarView?${params}`
      : `${MICROSOFT_GRAPH_API}/me/calendars/${calendarId}/calendarView?${params}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = await response.json();
  return data.value || [];
}

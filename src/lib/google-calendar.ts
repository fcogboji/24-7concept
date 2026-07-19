/**
 * Google Calendar API integration
 * Handles OAuth, token refresh, and calendar operations
 */

import { prisma } from "./prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string; displayName?: string }[];
}

/**
 * Get OAuth authorization URL
 */
export function getGoogleAuthUrl(userId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID not configured");
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: userId, // Pass userId to identify who's connecting
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGoogleCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
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
export async function refreshGoogleToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

/**
 * Get user's email from access token
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  const data = await response.json();
  return data.email;
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
    const tokens = await refreshGoogleToken(connection.refreshToken);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: tokens.access_token,
        tokenExpiresAt: newExpiresAt,
      },
    });

    return tokens.access_token;
  }

  return connection.accessToken;
}

/**
 * List user's calendars
 */
export async function listGoogleCalendars(connectionId: string) {
  const accessToken = await getValidAccessToken(connectionId);

  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to list calendars");
  }

  const data = await response.json();
  return data.items as {
    id: string;
    summary: string;
    primary?: boolean;
    accessRole: string;
  }[];
}

/**
 * Create a calendar event
 */
export async function createGoogleCalendarEvent(
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
    summary: event.summary,
    description: event.description,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: event.timezone,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      displayName: a.name,
    })),
  };

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
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
export async function updateGoogleCalendarEvent(
  connectionId: string,
  calendarId: string,
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
    summary: event.summary,
    description: event.description,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: event.timezone,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      displayName: a.name,
    })),
  };

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update event");
  }
}

/**
 * Delete a calendar event
 */
export async function deleteGoogleCalendarEvent(
  connectionId: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(connectionId);

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete event");
  }
}

/**
 * Get events in a date range
 */
export async function getGoogleCalendarEvents(
  connectionId: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getValidAccessToken(connectionId);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = await response.json();
  return data.items || [];
}

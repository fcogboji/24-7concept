/**
 * Pure availability computation — no database access.
 * All times are handled in the business timezone using Intl APIs.
 */

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "09:30"
}

interface AvailabilityParams {
  /** YYYY-MM-DD */
  date: string;
  weeklyHours: { dayOfWeek: number; startTime: string; endTime: string }[];
  blockedDates: { date: Date }[];
  existingAppointments: { startTime: Date; endTime: Date }[];
  slotDurationMin: number;
  bufferMin: number;
  timezone: string;
}

/** Convert "HH:mm" on a given date in a timezone to a UTC epoch ms */
function hmToEpoch(dateStr: string, hm: string, tz: string): number {
  const [h, m] = hm.split(":").map(Number);
  // Build an ISO string and parse in the target timezone
  const iso = `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  // Create date parts in the target timezone, then compute offset
  const utcGuess = new Date(iso + "Z");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  // Get what UTC time displays as in the target timezone
  const parts = formatter.formatToParts(utcGuess);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const tzH = Number(get("hour"));
  const tzM = Number(get("minute"));
  // Offset = what we want (h:m) minus what UTC shows in that TZ
  const wantMin = h * 60 + m;
  const gotMin = tzH * 60 + tzM;
  const diffMin = wantMin - gotMin;
  return utcGuess.getTime() - diffMin * 60_000;
}

/** Get the day-of-week (0=Sun) for a date string in a timezone */
function dayOfWeekInTz(dateStr: string, tz: string): number {
  const d = new Date(dateStr + "T12:00:00Z");
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const wd = formatter.format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

/** Format epoch ms to "HH:mm" in a timezone */
function epochToHm(epoch: number, tz: string): string {
  const d = new Date(epoch);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

/** Check if a date string matches any blocked date */
function isBlocked(dateStr: string, blockedDates: { date: Date }[]): boolean {
  for (const bd of blockedDates) {
    const bdStr = bd.date.toISOString().slice(0, 10);
    if (bdStr === dateStr) return true;
  }
  return false;
}

export function computeAvailableSlots(params: AvailabilityParams): TimeSlot[] {
  const { date, weeklyHours, blockedDates, existingAppointments, slotDurationMin, bufferMin, timezone } = params;

  if (isBlocked(date, blockedDates)) return [];

  const dow = dayOfWeekInTz(date, timezone);
  const dayHours = weeklyHours.filter((wh) => wh.dayOfWeek === dow);
  if (dayHours.length === 0) return [];

  const slotMs = slotDurationMin * 60_000;
  const bufferMs = bufferMin * 60_000;

  // Convert existing appointments to UTC epochs
  const busy = existingAppointments.map((a) => ({
    start: a.startTime.getTime(),
    end: a.endTime.getTime(),
  }));

  const slots: TimeSlot[] = [];

  for (const wh of dayHours) {
    const windowStart = hmToEpoch(date, wh.startTime, timezone);
    const windowEnd = hmToEpoch(date, wh.endTime, timezone);

    let cursor = windowStart;
    while (cursor + slotMs <= windowEnd) {
      const slotStart = cursor;
      const slotEnd = cursor + slotMs;

      // Check overlap with existing appointments (including buffer)
      const overlaps = busy.some(
        (b) => slotStart < b.end + bufferMs && slotEnd + bufferMs > b.start
      );

      if (!overlaps) {
        slots.push({
          start: epochToHm(slotStart, timezone),
          end: epochToHm(slotEnd, timezone),
        });
      }

      cursor += slotMs;
    }
  }

  return slots;
}

/** Convert "HH:mm" on a date in business timezone to a UTC Date */
export function businessTimeToUtc(dateStr: string, hm: string, timezone: string): Date {
  return new Date(hmToEpoch(dateStr, hm, timezone));
}

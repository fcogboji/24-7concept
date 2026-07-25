import { z } from "zod";

/**
 * Reusable Zod schemas and validators for common input patterns.
 * Use these across API routes to ensure consistent validation.
 */

// Email validation
export const emailSchema = z.string().email("Invalid email address").max(254);

// Phone number (basic international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

// URL validation (http/https only)
export const urlSchema = z
  .string()
  .url("Invalid URL")
  .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
    message: "URL must use http or https protocol",
  });

// Bot name validation
export const botNameSchema = z
  .string()
  .min(1, "Bot name is required")
  .max(100, "Bot name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s\-_]+$/, "Bot name can only contain letters, numbers, spaces, hyphens, and underscores");

// Bot description/business info
export const botBusinessInfoSchema = z
  .string()
  .max(10000, "Business info must be less than 10,000 characters")
  .optional();

// Session ID format (s_ prefix + hex)
export const sessionIdSchema = z
  .string()
  .regex(/^s_[a-f0-9]{8,64}$/, "Invalid session ID format");

// Bot ID format (cuid)
export const botIdSchema = z.string().cuid("Invalid bot ID");

// User message validation
export const chatMessageSchema = z
  .string()
  .min(1, "Message cannot be empty")
  .max(12000, "Message is too long (max 12,000 characters)");

// Webhook URL validation
export const webhookUrlSchema = z
  .string()
  .url("Invalid webhook URL")
  .refine((url) => url.startsWith("https://"), {
    message: "Webhook URL must use HTTPS",
  })
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Block localhost and private IPs
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname.endsWith(".localhost") ||
        parsed.hostname === "127.0.0.1" ||
        /^10\./.test(parsed.hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(parsed.hostname) ||
        /^192\.168\./.test(parsed.hostname)
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, "Webhook URL cannot point to localhost or private networks");

// Cron secret validation
export const cronSecretSchema = z
  .string()
  .min(16, "Cron secret must be at least 16 characters");

/**
 * HTML/XSS sanitization helper.
 * Strips all HTML tags from user input.
 * Use this before storing user-generated content that might be displayed.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove <script> tags
    .replace(/<[^>]+>/g, "") // Strip all HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers (onclick, etc)
    .trim();
}

/**
 * Validate and sanitize a page URL from widget embed.
 * Returns null if invalid.
 */
export function sanitizePageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    // Return sanitized URL (no query params with PII)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Validate pagination parameters.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Validate date range parameters.
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * Validate timezone string.
 */
export const timezoneSchema = z
  .string()
  .refine((tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone");

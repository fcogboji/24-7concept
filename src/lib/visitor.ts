import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getLogger } from "@/lib/logger";

const log = getLogger("visitor");

export type VisitorSignals = {
  ipHash: string | null;
  country: string | null;
  region: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrerHost: string | null;
};

/**
 * Salted HMAC of the IP. We keep a fingerprint (so a returning visitor can be
 * recognised) without ever storing the address itself — a DB dump yields nothing
 * resolvable back to a person. Without a secret we store nothing at all rather
 * than fall back to an unsalted hash, which is trivially reversible by brute force
 * across the whole IPv4 space.
 */
function hashIp(ip: string | null): string | null {
  const secret = process.env.SECRET_ENCRYPTION_KEY?.trim();
  if (!ip || ip === "unknown" || !secret) return null;
  return crypto.createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/** Geo is read from the edge's headers (Vercel / Cloudflare). We never call a geo-IP service. */
function geo(req: Request): { country: string | null; region: string | null } {
  const country =
    req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? null;
  const region = req.headers.get("x-vercel-ip-country-region") ?? null;
  return {
    country: country && country !== "XX" ? country.toUpperCase() : null,
    region: region || null,
  };
}

/** Minimal UA classification. A dependency here would be a supply-chain risk for three regexes. */
export function parseUserAgent(ua: string | null): {
  device: string | null;
  browser: string | null;
  os: string | null;
} {
  if (!ua) return { device: null, browser: null, os: null };

  const device = /bot|crawler|spider|crawling/i.test(ua)
    ? "bot"
    : /iPad|Tablet/i.test(ua)
      ? "tablet"
      : /Mobi|Android|iPhone/i.test(ua)
        ? "mobile"
        : "desktop";

  // Order matters: Edge and Chrome both claim "Chrome"; Chrome claims "Safari".
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\/|Opera/i.test(ua)
      ? "Opera"
      : /Firefox\//i.test(ua)
        ? "Firefox"
        : /Chrome\//i.test(ua)
          ? "Chrome"
          : /Safari\//i.test(ua)
            ? "Safari"
            : null;

  const os = /Windows/i.test(ua)
    ? "Windows"
    : /iPhone|iPad|iOS/i.test(ua)
      ? "iOS"
      : /Mac OS X|Macintosh/i.test(ua)
        ? "macOS"
        : /Android/i.test(ua)
          ? "Android"
          : /Linux/i.test(ua)
            ? "Linux"
            : null;

  return { device, browser, os };
}

/**
 * Host only. A full referring URL routinely carries PII in its query string
 * (emails in newsletter links, tokens in reset links) — storing it would quietly
 * turn an analytics table into a PII store.
 */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const h = new URL(referrer).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return null;
  }
}

export function collectVisitorSignals(req: Request, referrer?: string | null): VisitorSignals {
  const { country, region } = geo(req);
  const { device, browser, os } = parseUserAgent(req.headers.get("user-agent"));
  return {
    ipHash: hashIp(clientIp(req)),
    country,
    region,
    device,
    browser,
    os,
    referrerHost: referrerHost(referrer),
  };
}

/**
 * Upsert the session. First write wins for the acquisition fields (country, referrer,
 * landing page) — those describe how the visitor arrived and must not be overwritten
 * as they browse. Only lastSeenAt and messageCount move.
 *
 * Never throws: analytics must not be able to break a paying customer's chat.
 */
export async function recordVisitorSession(input: {
  botId: string;
  sessionId: string | null | undefined;
  pageUrl?: string | null;
  signals: VisitorSignals;
}): Promise<void> {
  const { botId, sessionId, pageUrl, signals } = input;
  if (!sessionId) return;

  try {
    await prisma.visitorSession.upsert({
      where: { botId_sessionId: { botId, sessionId } },
      create: {
        botId,
        sessionId,
        ipHash: signals.ipHash,
        country: signals.country,
        region: signals.region,
        device: signals.device,
        browser: signals.browser,
        os: signals.os,
        referrerHost: signals.referrerHost,
        landingPage: pageUrl ?? null,
        messageCount: 1,
      },
      update: {
        lastSeenAt: new Date(),
        messageCount: { increment: 1 },
      },
    });
  } catch (e) {
    log.error("failed to record visitor session", e, { botId });
  }
}

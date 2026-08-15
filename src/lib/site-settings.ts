import { prisma } from "@/lib/prisma";

export const SITE_SETTING_KEYS = {
  demoVideoUrl: "landing.demoVideoUrl",
  demoVideoLabel: "landing.demoVideoLabel",
} as const;

export type DemoVideo = {
  /** Original URL the admin pasted, kept so the form can show it again. */
  url: string;
  /** Iframe source on an allowlisted host (also present in the CSP frame-src). */
  embedUrl: string;
  provider: "youtube" | "vimeo" | "loom";
  /** Poster image for click-to-play; only YouTube exposes a predictable URL. */
  thumbnailUrl: string | null;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;
const DIGITS = /^\d{5,20}$/;
const LOOM_ID = /^[A-Za-z0-9]{16,64}$/;

/**
 * Converts a pasted share link into an embed URL, rejecting anything that is not
 * YouTube, Vimeo, or Loom. Admin input becomes an `iframe src`, so the host
 * allowlist is the security boundary — never embed an arbitrary URL.
 */
export function parseVideoUrl(raw: string): DemoVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
    const id =
      parsed.searchParams.get("v") ??
      (segments[0] === "embed" || segments[0] === "shorts" || segments[0] === "live"
        ? segments[1]
        : null);
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return {
      url: trimmed,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`,
      provider: "youtube",
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "youtu.be") {
    const id = segments[0];
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return {
      url: trimmed,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`,
      provider: "youtube",
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = segments.find((segment) => DIGITS.test(segment));
    if (!id) return null;
    return {
      url: trimmed,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      provider: "vimeo",
      thumbnailUrl: null,
    };
  }

  if (host === "loom.com") {
    const id = segments[0] === "share" || segments[0] === "embed" ? segments[1] : null;
    if (!id || !LOOM_ID.test(id)) return null;
    return {
      url: trimmed,
      embedUrl: `https://www.loom.com/embed/${id}`,
      provider: "loom",
      thumbnailUrl: null,
    };
  }

  return null;
}

export async function getSiteSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    // Landing page must still render if the settings table is unavailable.
    return null;
  }
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  if (!value) {
    await prisma.siteSetting.deleteMany({ where: { key } });
    return;
  }
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getDemoVideo(): Promise<{ video: DemoVideo | null; label: string | null }> {
  const [url, label] = await Promise.all([
    getSiteSetting(SITE_SETTING_KEYS.demoVideoUrl),
    getSiteSetting(SITE_SETTING_KEYS.demoVideoLabel),
  ]);

  return {
    video: url ? parseVideoUrl(url) : null,
    label: label?.trim() || null,
  };
}

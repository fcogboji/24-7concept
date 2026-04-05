import * as cheerio from "cheerio";
import { assertUrlSafeForServerFetch, isLocalTrainingUrlAllowed } from "@/lib/url-safety";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Helps some CDNs / WAFs accept the request as a normal document load. */
const BROWSER_FETCH_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

function sameRegistrableHost(a: string, b: string): boolean {
  return a.replace(/^www\./i, "").toLowerCase() === b.replace(/^www\./i, "").toLowerCase();
}

/** Some hosts return HTML with wrong or missing Content-Type. */
function responseLooksLikeHtml(contentType: string, body: string): boolean {
  const ct = contentType.toLowerCase();
  if (/\btext\/html\b/.test(ct) || /\bapplication\/xhtml/.test(ct)) return true;
  const head = body.slice(0, 1200).trim().toLowerCase();
  return (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    head.startsWith("<head") ||
    head.includes("<meta ") ||
    head.includes("<body")
  );
}

export type CrawlWebsiteStats = {
  pagesVisited: number;
  pagesWithUsableText: number;
  totalChars: number;
  fetchFailures: number;
  /** Set when a headless browser crawl ran (JS-rendered / SPA pages). */
  usedPlaywright?: boolean;
  /** Characters gathered from the initial static fetch before Playwright (if any). */
  staticCrawlChars?: number;
};

export type CrawlWebsiteResult = {
  text: string;
  stats: CrawlWebsiteStats;
};

function extractJsonLdText($: cheerio.CheerioAPI): string[] {
  const out: string[] = [];
  const keys = new Set([
    "name",
    "description",
    "headline",
    "text",
    "articleBody",
    "abstract",
  ]);

  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).html();
    if (!raw?.trim()) return;
    try {
      const j = JSON.parse(raw) as unknown;
      const visit = (node: unknown, depth: number) => {
        if (depth > 10 || node == null) return;
        if (typeof node === "string" && node.length > 20) {
          out.push(node);
          return;
        }
        if (Array.isArray(node)) {
          for (const x of node) visit(x, depth + 1);
          return;
        }
        if (typeof node === "object") {
          const o = node as Record<string, unknown>;
          for (const k of keys) {
            const v = o[k];
            if (typeof v === "string" && v.length > 12) out.push(v);
          }
          if ("@graph" in o && Array.isArray(o["@graph"])) {
            for (const x of o["@graph"]) visit(x, depth + 1);
          }
        }
      };
      visit(j, 0);
    } catch {
      /* ignore invalid JSON */
    }
  });
  return out;
}

function extractPageText($: cheerio.CheerioAPI): string {
  const jsonLd = extractJsonLdText($);

  $("script, style, noscript, iframe, svg").remove();

  let primary =
    $("main, article, [role='main'], [role='article']").first().text().trim() ||
    $("#content, .content, #main, #main-content, .main-content, .site-content, .entry-content, .post-content")
      .first()
      .text()
      .trim() ||
    $("#root, #app, #__next, [data-reactroot], #___gatsby").first().text().trim() ||
    $(".main, .Main, #page").first().text().trim() ||
    $("body").text().trim();
  primary = primary.replace(/\s+/g, " ").trim();

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").first().text().trim();
  const metaDesc =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="twitter:description"]').attr("content")?.trim() ||
    "";

  const extras: string[] = [];
  if (title.length > 2) extras.push(title);
  if (metaDesc.length > 8) extras.push(metaDesc);
  extras.push(...jsonLd);

  if (primary.length >= 12) {
    return [...extras, primary].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  const fromBlocks = $(
    "p, li, h1, h2, h3, h4, h5, h6, td, th, article, section, dd, dt, blockquote, figcaption, span.text, .prose"
  )
    .map((_, el) => $(el).text())
    .get()
    .join(" ");
  const fallback = fromBlocks.replace(/\s+/g, " ").trim();
  const merged = [...extras, fallback || primary].filter(Boolean).join(" ");
  return merged.replace(/\s+/g, " ").trim();
}

/** Parse HTML (e.g. after Playwright) with the same rules as the static crawler. */
export function extractTextFromHtmlString(html: string): string {
  const $ = cheerio.load(html);
  return extractPageText($);
}

/**
 * Static HTML fetch + link crawl. Does not execute JavaScript — SPAs and auth-only pages often look empty.
 * Prefer `crawlWebsiteForTraining` from this module for user-facing training.
 */
export async function crawlWebsite(startUrl: string, pageLimit = 8): Promise<CrawlWebsiteResult> {
  let base: URL;
  try {
    assertUrlSafeForServerFetch(startUrl, {
      allowLocalhost: isLocalTrainingUrlAllowed(),
    });
    base = new URL(startUrl);
  } catch (e) {
    throw e instanceof Error ? e : new Error("Invalid URL");
  }

  const visited = new Set<string>();
  const startHref = base.href.split("#")[0].split("?")[0];
  const queue: string[] = [startHref];

  const alt = new URL(startHref);
  if (alt.hostname.startsWith("www.")) {
    alt.hostname = alt.hostname.slice(4);
  } else {
    alt.hostname = `www.${alt.hostname}`;
  }
  const altHref = alt.href.split("#")[0].split("?")[0];
  if (altHref !== startHref) {
    queue.push(altHref);
  }

  const chunks: string[] = [];
  /** Minimum extracted text per page to count (title-only pages often land ~10–30 chars). */
  const minCharsPerPage = 8;
  let fetchFailures = 0;

  while (queue.length && visited.size < pageLimit) {
    const raw = queue.shift()!;
    let url: string;
    try {
      url = new URL(raw, base).href.split("#")[0];
    } catch {
      continue;
    }
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        headers: {
          ...BROWSER_FETCH_HEADERS,
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(t);
      const ct = res.headers.get("content-type") ?? "";
      const html = await res.text();
      const looksHtml = res.ok && responseLooksLikeHtml(ct, html);
      if (!res.ok) {
        fetchFailures++;
        continue;
      }
      if (!looksHtml) {
        fetchFailures++;
        continue;
      }
      const $ = cheerio.load(html);
      const text = extractPageText($);
      if (text.length >= minCharsPerPage) {
        chunks.push(text);
      }

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        try {
          const next = new URL(href, base);
          if (!sameRegistrableHost(next.hostname, base.hostname)) return;
          const hrefClean = next.href.split("#")[0];
          if (!visited.has(hrefClean) && !queue.includes(hrefClean)) {
            queue.push(hrefClean);
          }
        } catch {
          /* ignore */
        }
      });
    } catch {
      fetchFailures++;
    }
  }

  const text = chunks.join("\n\n");
  return {
    text,
    stats: {
      pagesVisited: visited.size,
      pagesWithUsableText: chunks.length,
      totalChars: text.length,
      fetchFailures,
    },
  };
}

/**
 * Runs the static crawler first; if there is not enough text (common for Next.js + Clerk / client-rendered sites),
 * retries with a headless Chromium crawl (Playwright). Set `CRAWLER_DISABLE_RENDER=1` to skip the browser pass.
 */
export async function crawlWebsiteForTraining(
  startUrl: string,
  pageLimit = 10
): Promise<CrawlWebsiteResult> {
  const staticResult = await crawlWebsite(startUrl, pageLimit);
  if (staticResult.text.length >= 24) {
    return staticResult;
  }
  if (process.env.CRAWLER_DISABLE_RENDER === "1") {
    return staticResult;
  }

  try {
    const { crawlWebsiteRendered } = await import("@/lib/crawler-rendered");
    const rendered = await crawlWebsiteRendered(startUrl, Math.min(pageLimit, 8));
    if (rendered.text.length > staticResult.text.length) {
      return {
        text: rendered.text,
        stats: {
          ...rendered.stats,
          usedPlaywright: true,
          staticCrawlChars: staticResult.stats.totalChars,
        },
      };
    }
  } catch (e) {
    console.error("[crawler] rendered crawl failed:", e);
  }

  return staticResult;
}

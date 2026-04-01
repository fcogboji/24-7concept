import * as cheerio from "cheerio";
import { assertUrlSafeForServerFetch } from "@/lib/url-safety";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sameRegistrableHost(a: string, b: string): boolean {
  return a.replace(/^www\./i, "").toLowerCase() === b.replace(/^www\./i, "").toLowerCase();
}

function extractPageText($: cheerio.CheerioAPI): string {
  $("script, style, noscript, iframe, svg").remove();
  let primary =
    $("main, article, [role='main']").first().text().trim() ||
    $("#content, .content, #main").first().text().trim() ||
    $("#root, #app, #__next").first().text().trim() ||
    $("body").text().trim();
  primary = primary.replace(/\s+/g, " ").trim();

  const title = $("title").first().text().trim();
  const metaDesc =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  const extras: string[] = [];
  if (title.length > 2) extras.push(title);
  if (metaDesc.length > 10) extras.push(metaDesc);

  if (primary.length >= 20) {
    return [extras.join(" "), primary].filter(Boolean).join("\n").replace(/\s+/g, " ").trim();
  }

  const fromBlocks = $("p, li, h1, h2, h3, h4, td, th, article, section, dd, dt")
    .map((_, el) => $(el).text())
    .get()
    .join(" ");
  const fallback = fromBlocks.replace(/\s+/g, " ").trim();
  const merged = [extras.join(" "), fallback || primary].filter(Boolean).join("\n");
  return merged.replace(/\s+/g, " ").trim();
}

export async function crawlWebsite(startUrl: string, pageLimit = 8): Promise<string> {
  let base: URL;
  try {
    assertUrlSafeForServerFetch(startUrl);
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
  const minCharsPerPage = 15;

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
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(t);
      const ct = res.headers.get("content-type") ?? "";
      const looksHtml = /\btext\/html\b/i.test(ct) || /\bapplication\/xhtml/i.test(ct);
      if (!res.ok || !looksHtml) {
        continue;
      }
      const html = await res.text();
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
      /* skip failed fetches */
    }
  }

  return chunks.join("\n\n");
}

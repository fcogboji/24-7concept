import * as cheerio from "cheerio";
import { assertUrlSafeForServerFetch } from "@/lib/url-safety";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function crawlWebsite(startUrl: string, pageLimit = 8): Promise<string> {
  let base: URL;
  try {
    assertUrlSafeForServerFetch(startUrl);
    base = new URL(startUrl);
  } catch (e) {
    throw e instanceof Error ? e : new Error("Invalid URL");
  }

  const visited = new Set<string>();
  const queue: string[] = [base.origin + base.pathname];
  const chunks: string[] = [];

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
        headers: { "User-Agent": UA, Accept: "text/html" },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) {
        continue;
      }
      const html = await res.text();
      const $ = cheerio.load(html);
      $("script, style, noscript, iframe, svg").remove();
      const main =
        $("main, article, [role='main']").first().text().trim() ||
        $("#content, .content, #main").first().text().trim() ||
        $("body").text().trim();
      const text = main.replace(/\s+/g, " ").trim();
      if (text.length > 120) {
        chunks.push(text);
      }

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        try {
          const next = new URL(href, base);
          if (next.hostname !== base.hostname) return;
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

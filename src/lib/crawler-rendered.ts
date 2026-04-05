import type { Browser } from "playwright-core";
import type { CrawlWebsiteResult } from "@/lib/crawler";
import { assertUrlSafeForServerFetch, isLocalTrainingUrlAllowed } from "@/lib/url-safety";

function sameRegistrableHost(a: string, b: string): boolean {
  return a.replace(/^www\./i, "").toLowerCase() === b.replace(/^www\./i, "").toLowerCase();
}

async function launchTrainBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");

  if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromiumMod = (await import("@sparticuz/chromium")) as {
      default: { args: string[]; executablePath: (path?: string) => Promise<string> };
    };
    const pack = chromiumMod.default;
    return chromium.launch({
      args: pack.args,
      executablePath: await pack.executablePath(),
      headless: true,
    });
  }

  const customPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (customPath) {
    return chromium.launch({ executablePath: customPath, headless: true });
  }

  try {
    const playwright = await import("playwright");
    return playwright.chromium.launch({ headless: true });
  } catch {
    throw new Error(
      "Rendered training needs Chromium: install with `npx playwright install chromium`, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a Chrome/Chromium binary. On Vercel, Playwright uses @sparticuz/chromium automatically."
    );
  }
}

const GOTO_MS = 22_000;
const HYDRATE_WAIT_MS = 1_800;

/**
 * Multi-page crawl using headless Chromium (executes JavaScript). Same host only.
 */
export async function crawlWebsiteRendered(
  startUrl: string,
  pageLimit = 8
): Promise<CrawlWebsiteResult> {
  let base: URL;
  try {
    assertUrlSafeForServerFetch(startUrl, {
      allowLocalhost: isLocalTrainingUrlAllowed(),
    });
    base = new URL(startUrl);
  } catch (e) {
    throw e instanceof Error ? e : new Error("Invalid URL");
  }

  const { extractTextFromHtmlString } = await import("@/lib/crawler");

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
  const minCharsPerPage = 8;
  let fetchFailures = 0;

  let browser: Browser | null = null;
  try {
    browser = await launchTrainBrowser();
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      locale: "en-US",
    });

    while (queue.length && visited.size < pageLimit) {
      const raw = queue.shift()!;
      let url: string;
      try {
        url = new URL(raw, base).href.split("#")[0].split("?")[0];
      } catch {
        continue;
      }
      if (visited.has(url)) continue;
      visited.add(url);

      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: GOTO_MS });
        await new Promise((r) => setTimeout(r, HYDRATE_WAIT_MS));
        const html = await page.content();
        const text = extractTextFromHtmlString(html);
        if (text.length >= minCharsPerPage) {
          chunks.push(text);
        }

        const hrefs = await page.$$eval("a[href]", (anchors) =>
          anchors.map((a) => (a as HTMLAnchorElement).getAttribute("href") || "").filter(Boolean)
        );
        for (const href of hrefs) {
          if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
            continue;
          }
          try {
            const next = new URL(href, base);
            if (!sameRegistrableHost(next.hostname, base.hostname)) continue;
            const hrefClean = next.href.split("#")[0].split("?")[0];
            if (!visited.has(hrefClean) && !queue.includes(hrefClean)) {
              queue.push(hrefClean);
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        fetchFailures++;
      } finally {
        await page.close().catch(() => {});
      }
    }

    await context.close();
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
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

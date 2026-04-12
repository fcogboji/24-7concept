import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { getVercelProtectionBypassSecret } from "@/lib/widget-embed-snippet";

const HEADERS = {
  "Content-Type": "application/javascript; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Cross-Origin-Resource-Policy": "cross-origin",
} as const;

/**
 * Same `public/widget.js` plus optional prelude for Vercel Deployment Protection bypass.
 * Served at `/embed/widget.js` (preferred: middleware matcher skips `*.js` like `/widget.js`)
 * and legacy `/embed/widget-js`.
 */
export async function embedWidgetScriptGET(): Promise<NextResponse> {
  const filePath = path.join(process.cwd(), "public", "widget.js");
  try {
    const file = await readFile(filePath, "utf8");
    const bypass = getVercelProtectionBypassSecret();
    const prelude =
      bypass && bypass.length > 0
        ? `try{window.__NESTBOT_BYPASS=${JSON.stringify(bypass)};}catch(e){}\n`
        : "";
    const body = prelude + file;
    return new NextResponse(body, { status: 200, headers: HEADERS });
  } catch {
    return new NextResponse("// widget.js missing on server\n", {
      status: 500,
      headers: HEADERS,
    });
  }
}

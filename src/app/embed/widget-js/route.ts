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
 * Preferred embed URL: same `public/widget.js` plus an optional prelude that sets
 * `window.__247CONCEPT_BYPASS` from server env (VERCEL_AUTOMATION_BYPASS_SECRET or
 * WIDGET_VERCEL_PROTECTION_BYPASS). Third-party sites can load this without putting the
 * bypass token in the script URL — required when Vercel Deployment Protection is on.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "widget.js");
  try {
    const file = await readFile(filePath, "utf8");
    const bypass = getVercelProtectionBypassSecret();
    const prelude =
      bypass && bypass.length > 0
        ? `try{window.__247CONCEPT_BYPASS=${JSON.stringify(bypass)};}catch(e){}\n`
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

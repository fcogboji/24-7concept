import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const HEADERS = {
  "Content-Type": "application/javascript; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Cross-Origin-Resource-Policy": "cross-origin",
} as const;

/**
 * Public embed URL (some integrations use `/embed/widget-js` instead of `/widget.js`).
 * Always serves this deployment’s `public/widget.js` from disk — no HTTP hop to another
 * host (avoids 401 from Vercel Deployment Protection on preview URLs).
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "widget.js");
  try {
    const body = await readFile(filePath, "utf8");
    return new NextResponse(body, { status: 200, headers: HEADERS });
  } catch {
    return new NextResponse("// widget.js missing on server\n", {
      status: 500,
      headers: HEADERS,
    });
  }
}

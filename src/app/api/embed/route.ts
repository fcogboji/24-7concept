import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Same script as `/public/widget.js`, served from the App Router so headers stay ORB-friendly
 * (no accidental `nosniff` merge issues on some hosts). Prefer this URL in embeds if `/widget.js` fails.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "widget.js");
  const body = await readFile(filePath, "utf8");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
